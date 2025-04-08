import fs from 'fs';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { createCanvas, registerFont } from 'canvas';
import { fileURLToPath } from 'url';
import path from 'path';

let interval = null;

// Register the fancy font (make sure font.ttf exists)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
registerFont(path.join(__dirname, '../font.ttf'), { family: 'FancyFont' });

async function getCoordinates(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  const data = await res.json();
  const place = data.results?.[0];
  if (!place) throw new Error(`City "${city}" not found`);
  return { latitude: place.latitude, longitude: place.longitude };
}

function getDateTimeString() {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = dayNames[now.getDay()];
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  let hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'P.M' : 'A.M';
  hours = hours % 12 || 12;
  return `${day} ${dd}.${mm}.${yyyy} ${hours}:${mins} ${ampm}`;
}

async function getWeather(lat, lon) {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`);
  const data = await res.json();
  return data.current.temperature_2m;
}

async function generateImage(city, lat, lon) {
  const temperature = await getWeather(lat, lon);
  const dateText = getDateTimeString();
  const finalText = `${dateText} ${temperature}°C`;

  const inputImage = 'dp.jpg';
  const outputImage = 'autodp.jpg';

  const image = sharp(inputImage);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 64px FancyFont';
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  ctx.fillText(finalText, width / 2, height - 150);

  const overlayBuffer = canvas.toBuffer();

  await sharp(inputImage)
    .composite([{ input: overlayBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 100 })
    .toFile(outputImage);

  return outputImage;
}

export default {
  name: '.autodp',
  description: 'Updates your WhatsApp profile picture with date & weather every X seconds',

  async execute(msg, args, client) {
    const command = msg.body.toLowerCase().trim();
    const AUTO_DP_INTERVAL = parseInt(process.env.AUTO_DP_INTERVAL_MS || '60000', 10);
    const CITY = process.env.CITY || 'Delhi';

    if (command === '.stopdp') {
      if (interval) {
        clearInterval(interval);
        interval = null;
        return msg.reply('🛑 AutoDP stopped.');
      } else {
        return msg.reply('ℹ️ AutoDP is not running.');
      }
    }

    if (interval) {
      return msg.reply('⚠️ AutoDP is already running!');
    }

    msg.reply(`✅ AutoDP started for ${CITY}! Updating every ${AUTO_DP_INTERVAL / 1000}s.`);

    try {
      const { latitude, longitude } = await getCoordinates(CITY);

      // Download profile picture once
      const user = await msg.getContact();
      const dp = await user.getProfilePicUrl();
      const res = await fetch(dp);
      const buffer = await res.buffer();
      fs.writeFileSync('dp.jpg', buffer);

      // Set interval to update every minute
      interval = setInterval(async () => {
        try {
          const filePath = await generateImage(CITY, latitude, longitude);
          await client.setProfilePic(filePath);
          console.log(`✅ Updated profile picture at ${new Date().toLocaleTimeString()}`);
        } catch (err) {
          console.error('❌ Error updating profile picture:', err.message);
        }
      }, AUTO_DP_INTERVAL);

    } catch (err) {
      console.error('❌ Failed to start AutoDP:', err.message);
      msg.reply(`❌ Could not start AutoDP: ${err.message}`);
    }
  }
};
