import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { createCanvas, registerFont } from 'canvas';

let autodpInterval = null;

const FONT_URL = 'https://github.com/google/fonts/raw/main/ofl/lobster/Lobster-Regular.ttf';
const FONT_PATH = path.join(os.tmpdir(), 'Lobster-Regular.ttf');
const FONT_NAME = 'FancyFont';
const IMAGE_PATH = 'dp.jpg'; // Change to your base image path

async function ensureFont() {
  if (!fs.existsSync(FONT_PATH)) {
    const res = await fetch(FONT_URL);
    const buf = await res.arrayBuffer();
    fs.writeFileSync(FONT_PATH, Buffer.from(buf));
  }
  registerFont(FONT_PATH, { family: FONT_NAME });
}

async function getLatLon(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error('City not found');
  return data.results[0];
}

async function getTemperature(city) {
  const { latitude, longitude } = await getLatLon(city);
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
  const data = await res.json();
  return Math.round(data.current.temperature_2m);
}

function formatTime(temp) {
  const now = new Date();
  const datePart = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(',', '');

  const timePart = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} ${timePart} ${temp}°C`;
}

async function generateOverlayedImage(city) {
  await ensureFont();

  const temp = await getTemperature(city);
  const finalText = formatTime(temp);

  const inputImage = IMAGE_PATH;
  const outputImage = 'final_dp.jpg';

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

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;

  ctx.fillText(finalText, width / 2 - 15, height - 250); 

  const overlayBuffer = canvas.toBuffer();

  const outputBuffer = await sharp(inputImage)
    .composite([{ input: overlayBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 100 })
    .toBuffer();

  return outputBuffer;
}

export default {
  name: '.autodp',
  description: 'Start updating your DP every X seconds with styled clock + temperature',

  async execute(msg, args, client) {
    const AUTO_DP_INTERVAL = parseInt(process.env.AUTO_DP_INTERVAL_MS || '60000', 10);
    const CITY = process.env.CITY || 'Kolkata';

    if (autodpInterval) {
      await msg.reply('⚠️ AutoDP is already running.');
      return;
    }

    await msg.reply(`✅ AutoDP started! Updating every ${AUTO_DP_INTERVAL / 1000}s for city ${CITY}`);

    const updateDP = async () => {
      try {
        const buffer = await generateOverlayedImage(CITY);
        await client.setProfilePic(buffer);
        console.log('✅ DP updated');
      } catch (err) {
        console.error('❌ DP update error:', err.message);
      }
    };

    await updateDP(); // run immediately
    autodpInterval = setInterval(updateDP, AUTO_DP_INTERVAL);
  }
};
