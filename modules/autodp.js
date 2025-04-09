import fetch from 'node-fetch';
import sharp from 'sharp';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import weather from 'weather-js';

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia, Poll, GroupChat } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const city = process.env.CITY || 'Kolkata';
export let autodpInterval = null;
const fontPath = path.join(__dirname, 'Lobster-Regular.ttf');
const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/lobster/Lobster-Regular.ttf';

function getDateTimeString() {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const date = new Date(now);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = dayNames[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  let hours = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'P.M' : 'A.M';
  hours = hours % 12 || 12;

  return `${day} ${dd}.${mm}.${yyyy} ${hours}:${mins} ${ampm}`;
}

async function ensureFontDownloaded() {
  if (fs.existsSync(fontPath) && fs.statSync(fontPath).size >= 10000) return;

  await new Promise((resolve, reject) => {
    https.get(fontUrl, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Failed to download font: ${res.statusCode}`));

      const file = fs.createWriteStream(fontPath);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

const imageUrl = process.env.IMAGE_URL || 'https://raw.githubusercontent.com/ayusc/mywhatsappbot/main/dp.jpg';
const imagePath = path.join(__dirname, 'dp.jpg');
const outputImage = path.join(__dirname, 'output.jpg');

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
  return new Promise((resolve, reject) => {
    weather.find({ search: city, degreeType: 'C' }, function (err, result) {
      if (err || !result || result.length === 0) {
        console.log('❌ Failed to get weather:', err?.message || 'No results');
        return resolve('N/A');
      }
      const temp = result[0].current.temperature;
      resolve(temp);
    });
  });
}

async function generateImage() {
  const temperature = await getWeather();
  const dateText = getDateTimeString();
  const finalText = `${dateText} ${temperature} °C`;

  const image = sharp(imagePath);
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

  await sharp(imagePath)
    .composite([{ input: overlayBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 100 })
    .toFile(outputImage);

  console.log('✅ Done! Image Modified !');
}

export default {
  name: '.autodp',
  description: 'Automatically update profile pic with clock & temp from a static image',

  async execute(msg, args, client) {
    if (autodpInterval) {
      await msg.reply('⚠️ AutoDP is already running!');
      return;
    }
    
    ensureFontDownloaded().then(() => {
      console.log('Font downloaded successfully!');
      registerFont(fontPath, { family: 'FancyFont' });
      }).catch(console.error);

    downloadImage().then(() => {
      console.log('Profile pic downloaded as dp.jpg');
    }).catch(console.error);
    
    const intervalMs = parseInt(process.env.AUTO_DP_INTERVAL_MS || '5000', 10);
    await msg.reply(`✅ AutoDP started. Updating every ${intervalMs / 1000}s.`);
    autodpInterval = setInterval(async () => {
      try {
        await generateImage();
        const mediadp = await MessageMedia.fromFilePath(outputImage);
        await client.setProfilePicture(mediadp);
        await fs.unlink('./output.jpg');
        
        console.log('✅ DP updated');
      } catch (err) {
        console.error('❌ Error in AutoDP:', err.message);
      }
    }, intervalMs);
  }
};
