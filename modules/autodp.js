import fetch from 'node-fetch';
import sharp from 'sharp';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import followRedirects from 'follow-redirects';
const { https } = followRedirects;

const fontPath = path.resolve('./Lobster-Regular.ttf');

async function ensureFontLoaded() {
  if (!fs.existsSync(fontPath) || fs.statSync(fontPath).size < 10000) {
    const file = fs.createWriteStream(fontPath);
    await new Promise((resolve, reject) => {
      https.get('https://github.com/google/fonts/raw/main/ofl/lobster/Lobster-Regular.ttf', (res) => {
        if (res.statusCode !== 200) return reject(new Error(`Failed to download font: ${res.statusCode}`));
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
      }).on('error', reject);
    });
  }

  try {
    registerFont(fontPath, { family: 'FancyFont' });
  } catch (err) {
    throw new Error(`Failed to register font: ${err.message}`);
  }
}

// Shared state
export let autodpInterval = null;

export default {
  name: '.autodp',
  description: 'Automatically update profile pic with clock & temp from a static image',

  async execute(msg, args, client) {
    if (autodpInterval) {
      await msg.reply('⚠️ AutoDP is already running!');
      return;
    }

    await ensureFontLoaded();

    const city = process.env.CITY || 'Kolkata';
    const intervalMs = parseInt(process.env.AUTO_DP_INTERVAL_MS || '5000', 10);
    const imageUrl = process.env.IMAGE_URL || 'https://raw.githubusercontent.com/ayusc/mywhatsappbot/main/dp.jpg'; // Your image link here

    await msg.reply(`✅ AutoDP started. Updating every ${intervalMs / 1000}s.`);

    autodpInterval = setInterval(async () => {
      try {
        // Download image from link
        const imgBuffer = await fetch(imageUrl)
          .then(res => res.arrayBuffer())
          .then(buf => Buffer.from(buf))
          .catch(() => null);

        if (!imgBuffer) {
          console.log('❌ Failed to download image');
          return;
        }

        // Get weather
        const locationRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        const locationData = await locationRes.json();
        const { latitude, longitude } = locationData.results?.[0] || {};
        if (!latitude || !longitude) return console.log('❌ Could not find city coordinates');

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
        const weatherData = await weatherRes.json();
        const temperature = weatherData.current?.temperature_2m || 'N/A';

        const now = new Date();
        const options = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
        const formattedTime = now.toLocaleString('en-US', options).replace(',', '');
        const finalText = `${formattedTime} ${temperature}°C`;

        const baseSize = 640;
        const resizedImageBuffer = await sharp(imgBuffer).resize(baseSize, baseSize).toBuffer();

        const canvas = createCanvas(baseSize, baseSize);
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, baseSize, baseSize);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 52px FancyFont';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;

        ctx.fillText(finalText, baseSize / 2 - 15, baseSize - 250);

        const overlayBuffer = canvas.toBuffer();

        const finalImageBuffer = await sharp(resizedImageBuffer)
        .composite([{ input: canvas.toBuffer(), top: 0, left: 0 }])
        .flatten() // Removes alpha channel
        .jpeg({ quality: 100 })
        .toBuffer();

        const base64Image = `data:image/jpeg;base64,${finalImageBuffer.toString('base64')}`;
        await client.setProfilePicture(client.info.wid._serialized, base64Image);

        console.log('✅ DP updated');
      } catch (err) {
        console.error('❌ Error in AutoDP:', err.message);
      }
    }, intervalMs);
  }
};
