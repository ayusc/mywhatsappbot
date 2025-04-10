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
  const options = { timeZone: 'Asia/Kolkata', hour12: true };
  const now = new Date();

  const day = now.toLocaleString('en-IN', { weekday: 'short', ...options });
  const dd = now.toLocaleString('en-IN', { day: '2-digit', ...options });
  const mm = now.toLocaleString('en-IN', { month: '2-digit', ...options });
  const yyyy = now.toLocaleString('en-IN', { year: 'numeric', ...options });
  let time = now.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, ...options });

  // Convert "AM"/"PM" to "A.M"/"P.M"
  time = time.replace(/\s?am/, ' A.M').replace(/\s?pm/, ' P.M');

  return `${day} ${dd}.${mm}.${yyyy} ${time}`;
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
    weather.find({ search: 'Kolkata', degreeType: 'C' }, function (err, result) {
      if (err || !result || result.length === 0) {
        console.log('❌ Failed to get weather:', err?.message || 'No results');
        return resolve(null);
      }

      const current = result[0].current;
      const forecast = result[0].forecast[0]; // Today's forecast

      const weatherDetails = {
        location: result[0].location.name,
        temperature: current.temperature + '°C',
        feelsLike: current.feelslike + '°C',
        sky: current.skytext,
        windSpeed: current.winddisplay,
        humidity: current.humidity + '%',
        forecastText: forecast.skytextday,
        rainChance: forecast.precip + '%',
        date: forecast.date,
      };

      resolve(weatherDetails);
    });
  });
}

async function generateImage() {
  const weatherInfo = await getWeather(); 
  
  const dateText = getDateTimeString();
  const finalText = `${dateText} ${weatherInfo.temperature} (Feels Like ${weatherInfo.feelsLike})\nWind ${weatherInfo.windSpeed}, Humidity ${weatherInfo.humidity}, Rainfall Chances ${weatherInfo.rainChance}\nCurrent Condtions: ${weatherInfo.sky}, Forecast: ${weatherInfo.forecastText}`;

  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px FancyFont';
  ctx.fillStyle = 'white';

  // Add shadow for better visibility
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;

  // Position the text a bit upward from bottom (e.g., 150px instead of 100px)
  ctx.fillText(finalText, width / 2 - 15, height - 200);

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
    
    const intervalMs = parseInt(process.env.AUTO_DP_INTERVAL_MS || '60000', 10);
    await msg.reply(`✅ AutoDP started.\nUpdating every ${intervalMs / 1000}s`);
    
    // Calculate IST-based delay to next interval start
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const date = new Date(now);
    const seconds = date.getSeconds();
    const millisUntilNextInterval = intervalMs - (seconds * 1000) % intervalMs;
    
    setTimeout(() => {
      // Start interval
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
    
      // Do the first update exactly on sync
      generateImage()
      .then(async () => {
        const mediadp = await MessageMedia.fromFilePath(outputImage);
        await client.setProfilePicture(mediadp);
        await fs.unlink('./output.jpg');
        console.log('✅ First synced DP update done');
      })
      .catch(() => {});
    
    }, millisUntilNextInterval);

  }
};
