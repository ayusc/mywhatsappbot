import { Client, LegacySessionAuth } from 'whatsapp-web.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Parse session from env
function getSessionFromEnv() {
  try {
    const raw = process.env.WHATSAPP_SESSION;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ Invalid WHATSAPP_SESSION format');
    return null;
  }
}

// Load modules
const modules = [];
const moduleFiles = fs.readdirSync('./modules').filter(file => file.endsWith('.js'));
for (const file of moduleFiles) {
  const mod = await import(`./modules/${file}`);
  modules.push(mod.default);
}

const client = new Client({
  authStrategy: new LegacySessionAuth({
    session: getSessionFromEnv()
  }),
  puppeteer: {
    args: ['--no-sandbox']
  }
});

client.on('ready', () => {
  console.log('🤖 WhatsApp userbot is ready!');
});

client.on('message', async message => {
  for (const mod of modules) {
    await mod.execute(client, message);
  }
});

client.initialize();
