import fetch from 'node-fetch';
import sharp from 'sharp';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import https from 'https';

const fontPath = path.resolve('./Lobster-Regular.ttf');

async function ensureFontLoaded() {
  if (!fs.existsSync(fontPath)) {
    const file = fs.createWriteStream(fontPath);
    await new Promise((resolve, reject) => {
      https.get('https://github.com/google/fonts/raw/main/ofl/lobster/Lobster-Regular.ttf', (res) => {
        res.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
        file.on('error', reject);
      });
    });
  }

  registerFont(fontPath, { family: 'FancyFont' });
}

// Shared state
export let autodpInterval = null;

export default {
  name: '.autodp',
  description: 'Automatically update profile pic with clock & temp',

  async execute(msg, args, client) {
    if (autodpInterval) {
      await msg.reply('⚠️ AutoDP is already running!');
      return;
    }
    await ensureFontLoaded();
    const city = process.env.CITY || 'Kolkata';
    const intervalMs = parseInt(process.env.AUTO_DP_INTERVAL_MS || '60000', 10);

    await msg.reply(`✅ AutoDP started. Updating every ${intervalMs / 1000}s.`);

    const userId = msg.fromMe ? client.info.wid._serialized : msg.author || msg.from;

    autodpInterval = setInterval(async () => {
      try {
        const contact = await client.getContactById(userId);
        const imgBuffer = await contact.getProfilePicUrl()
          .then(url => fetch(url).then(res => res.buffer()))
          .catch(() => null);
        if (!imgBuffer) return console.log('❌ No profile picture found');

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

        const image = sharp(imgBuffer);
        const metadata = await image.metadata();
        const { width, height } = metadata;

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
        const finalImageBuffer = await sharp(imgBuffer)
          .composite([{ input: overlayBuffer, top: 0, left: 0 }])
          .jpeg({ quality: 100 })
          .toBuffer();

        await client.setProfilePicture(client.info.wid._serialized, finalImageBuffer);
        console.log('✅ DP updated');
      } catch (err) {
        console.error('❌ Error in AutoDP:', err.message);
      }
    }, intervalMs);
  }
};
