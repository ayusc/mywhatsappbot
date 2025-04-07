import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import qrcode from 'qrcode-terminal';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { connectDB, saveSession, getSession } from './db.js';

dotenv.config();
await connectDB();

let client;

(async () => {
  const sessionData = await getSession();

  client = new Client({
    puppeteer: {
      headless: true,
      executablePath: puppeteer.executablePath(),
      args: ['--no-sandbox']
    },
    session: sessionData
  });

  client.on('qr', qr => {
    console.log('📲 Scan this QR code:');
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', async (session) => {
    console.log("🔐 Authenticated");
    await saveSession(session);
  });

  client.on('auth_failure', msg => {
    console.error('❌ Authentication failure', msg);
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp is ready!');
  });

  client.on('message', async msg => {
    if (msg.body === '!ping') {
      msg.reply('🏓 Pong!');
    }
  });

  client.initialize();
})();
