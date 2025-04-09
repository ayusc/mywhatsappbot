import fetch from 'node-fetch';
import sharp from 'sharp';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = path.join(__dirname, 'font.ttf');
const city = process.env.CITY || 'Kolkata';

async function ensureFontDownloaded() {
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
}

registerFont('./font.ttf', { family: 'FancyFont' });

const imageUrl = process.env.IMAGE_URL || 'https://raw.githubusercontent.com/ayusc/mywhatsappbot/main/dp.jpg';
const imagePath = path.join(__dirname, 'dp.jpg');
const outputImage = 'output.jpg';

async function downloadImage() {
  const file = fs.createWriteStream(imagePath);
  await new Promise((resolve, reject) => {
    https.get(imageUrl, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Failed to download image: ${res.statusCode}`));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function getWeather() {
  const locationRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
  const locationData = await locationRes.json();
  const { latitude, longitude } = locationData.results?.[0] || {};
  if (!latitude || !longitude) return console.log('❌ Could not find city coordinates');
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`);
  const data = await res.json();
  return data.current.temperature_2m;
}

async function generateImage() {
  const temperature = await getWeather();
  const dateText = getDateTimeString();
  const finalText = `${dateText} ${temperature} °C`;

  const image = sharp(inputImage);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 52px FancyFont';
  ctx.fillStyle = 'white';

  // Add shadow for better visibility
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;

  // Position the text a bit upward from bottom (e.g., 150px instead of 100px)
  ctx.fillText(finalText, width / 2 - 15, height - 250);

  const overlayBuffer = canvas.toBuffer();

  await sharp(inputImage)
    .composite([{ input: overlayBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 100 })
    .toFile(outputImage);

  console.log('✅ Done! Image Modified !');
}

ensureFontDownloaded().then(() => {
  console.log('Font downloaded successfully!');
}).catch(console.error);

downloadImage().then(() => {
  console.log('Profile pic downloaded as dp.jpg');
}).catch(console.error);

export let autodpInterval = null;

export default {
  name: '.autodp',
  description: 'Automatically update profile pic with clock & temp from a static image',

  async execute(msg, args, client) {
    if (autodpInterval) {
      await msg.reply('⚠️ AutoDP is already running!');
      return;
    }
    
    const intervalMs = parseInt(process.env.AUTO_DP_INTERVAL_MS || '5000', 10);
    await msg.reply(`✅ AutoDP started. Updating every ${intervalMs / 1000}s.`);
    autodpInterval = setInterval(async () => {
      try {
        generateImage();
        await client.setProfilePicture('./output.jpg');
        await fs.unlink('./output.jpg');
        console.log('✅ DP updated');
      } catch (err) {
        console.error('❌ Error in AutoDP:', err.message);
      }
    }, intervalMs);
  }
};
