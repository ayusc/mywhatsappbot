import pkg from 'whatsapp-web.js';
const { Client, RemoteAuth } = pkg;

import qrcode from 'qrcode-terminal';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startCountdown } from './newaction.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log('✅ Connected to MongoDB');

const store = new MongoStore({ mongoose });
const client = new Client({
  authStrategy: new RemoteAuth({
    store: store,
    backupSyncIntervalMs: 300000,
  }),
  puppeteer: {
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox'],
  },
});

// Load command modules
const commands = new Map();
const modulesPath = path.join(__dirname, 'modules');
const moduleFiles = fs.readdirSync(modulesPath).filter(file => file.endsWith('.js'));

for (const file of moduleFiles) {
  const module = await import(`./modules/${file}`);
  if (module.default?.name && module.default?.execute) {
    commands.set(module.default.name, module.default);
    console.log(`✅ Loaded command: ${module.default.name}`);
  } else {
    console.warn(`⚠️ Skipped invalid module: ${file}`);
  }
}

// Event listeners
client.on('qr', qr => {
  console.log('📲 Scan this QR code:');
  qrcode.generate(qr, { small: true });
});

let isReady = false;
let isAuthenticated = false;

client.on('authenticated', () => {
  if (!isAuthenticated) {
    console.log('🔐 Authenticated!');
    isAuthenticated = true;
  }
});

client.on('ready', () => {
  if (!isReady) {
    console.log('✅ WhatsApp is ready!');
    isReady = true;
  }
});

client.on('auth_failure', msg => console.error('❌ Authentication failure:', msg));

// Command handler
client.on('message_create', async (msg) => {
  if (!msg.fromMe || !msg.body.startsWith('.')) return;

  const args = msg.body.trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (commands.has(command)) {
    try {
      await commands.get(command).execute(msg, args, client);
    } catch (err) {
      console.error(`❌ Error executing ${command}:`, err);
    }
  }
});

client.initialize();

startCountdown().catch(console.error); 
