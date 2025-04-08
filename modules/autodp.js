import fetch from 'node-fetch';
import sharp from 'sharp';
import fs from 'fs';
import { createCanvas, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

registerFont(path.join(__dirname, '../fonts/Lobster-Regular.ttf'), { family: 'FancyFont' });

export let autodpInterval = null;

export default {
  name: '.autodp',
  description: 'Start updating profile pic with date, time, and temperature',

  async execute(msg, args, client) {
    if (autodpInterval) {
      await msg.reply('⚠️ AutoDP is already running!');
      return;
    }

    const AUTO_DP_INTERVAL = parseInt(process.env.AUTO_DP_INTERVAL_MS || '60000', 10); // default 60s
    const CITY = process.env.CITY || 'Kolkata';

    await msg.reply(`✅ AutoDP started! Updating every ${AUTO_DP_INTERVAL / 1000} seconds.`);

    autodpInterval = setInterval(async () => {
      try {
        const quoted = await msg.getContact();
        const pfp = await client.profilePictureUrl(quoted.id._serialized, 'image');
        const res = await fetch(pfp);
        const buffer = Buffer.from(await res.arrayBuffer());

        const weatherRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${CITY}`);
        const { results } = await weatherRes.json();
        if (!results || results.length === 0) throw new Error('City not found');
        const { latitude, longitude } = results[0];

        const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
        const { current } = await weather.json();
        const temperature = current.temperature_2m;

        const now = new Date();
        const day = now.toLocaleDateString('en-GB', { weekday: 'short' });
        const date = now.toLocaleDateString('en-GB').replace(/\//g, '.');
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const ampm = now.toLocaleTimeString('en-US', { hour: '2-digit' }).includes('AM') ? 'A.M' : 'P.M';

        const finalText = `${day} ${date} ${time} ${ampm} ${temperature}°C`;

        const image = sharp(buffer);
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

        const outputPath = path.join(__dirname, '../temp/profile.jpg');
        await sharp(buffer)
          .composite([{ input: overlayBuffer, top: 0, left: 0 }])
          .jpeg({ quality: 100 })
          .toFile(outputPath);

        await client.updateProfilePicture(msg.from, fs.readFileSync(outputPath));
        console.log('✅ Profile picture updated');
      } catch (err) {
        console.error('❌ Error in AutoDP:', err.message);
      }
    }, AUTO_DP_INTERVAL);
  }
};
