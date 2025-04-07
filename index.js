import pkg from 'whatsapp-web.js';
const { Client, RemoteAuth } = pkg;

import qrcode from 'qrcode-terminal';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("✅ Connected to MongoDB");

const store = new MongoStore({ mongoose: mongoose });
const client = new Client({
  authStrategy: new RemoteAuth({
    store: store,
    backupSyncIntervalMs: 300000, // Optional: sync every 5 mins
  }),
  puppeteer: {
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox'],
  },
});

// Generate QR Code in terminal
client.on('qr', (qr) => {
  console.log('📲 Scan this QR code:');
  qrcode.generate(qr, { small: true });
});

// Client authenticated
client.on('authenticated', () => {
  console.log('🔐 Authenticated with RemoteAuth!');
});

// Auth failure
client.on('auth_failure', msg => {
  console.error('❌ Authentication failure:', msg);
});

// Ready
client.on('ready', () => {
  console.log('✅ WhatsApp is ready!');
});

// Handle incoming messages
client.on('message', async (msg) => {
  if (msg.body === '!ping') {
    msg.reply('🏓 Pong!');
  }
});

// Initialize client
client.initialize();
