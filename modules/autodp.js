// modules/autodp.js

import fetch from 'node-fetch';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { createCanvas, registerFont, loadImage } from 'canvas';

import { autodpInterval } from './stopdp.js'; // To avoid duplicate declarations

const FONT_URL = 'https://fonts.gstatic.com/s/lobster/v28/neILzCirqoswsqX9zoymM5Ez.woff2';
const FONT_PATH = './Lobster-Regular.ttf';

let interval = null;

export default {
  name: '.autodp',
  description: 'Automatically updates profile picture with time & weather info',

  async execute(msg, args, client) {
    const CITY = process.env.CITY || 'Kolkata';
    const AUTO_DP_INTERVAL = parseInt(process.env.AUTO_DP_INTERVAL_MS || '60000', 10);

    if (interval) {
      await msg.reply('⚠️ AutoDP is already running!');
      return;
    }

    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${CITY}`);
    const locData = await res.json();
    const { latitude, longitude } = locData.results[0];

    // Download font
    const fontBuffer = await fetch(FONT_URL).then(r => r.arrayBuffer());
    await fs.writeFile(FONT_PATH, Buffer.from(fontBuffer));
    registerFont(FONT_PATH, { family: 'Lobster' });

    interval = setInterval(async () => {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
        const weatherData = await weatherRes.json();
        const temperature = weatherData.current.temperature_2m;

        const now = new Date();
        const formattedTime = now.toLocaleString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const finalText = `${formattedTime} ${temperature} °C`;

        const profilePic = await msg.author.getProfilePicUrl();
        const inputImage = path.resolve('./dp.jpg');
        const outputImage = path.resolve('./dp-out.jpg');

        const imgBuffer = await fetch(profilePic).then(res => res.buffer());
        await fs.writeFile(inputImage, imgBuffer);

        const image = sharp(inputImage);
        const metadata = await image.metadata();
        const { width, height } = metadata;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, width, height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 52px "Lobster"';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;

        ctx.fillText(finalText, width / 2 - 15, height - 250);

        const overlayBuffer = canvas.toBuffer();

        await sharp(inputImage)
          .composite([{ input: overlayBuffer, top: 0, left: 0 }])
          .jpeg({ quality: 100 })
          .toFile(outputImage);

        await client.setProfilePicture(outputImage);
        console.log('✅ DP updated!');
      } catch (err) {
        console.error('❌ AutoDP Error:', err.message);
      }
    }, AUTO_DP_INTERVAL);

    await msg.reply('✅ AutoDP started!');
  }
};

export { interval as autodpInterval };
