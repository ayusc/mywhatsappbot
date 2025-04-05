import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSession, saveSession } from './session-store.js';
import pkg from 'whatsapp-web.js';
const { LegacySessionAuth } = pkg;

// Helper for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all modules
const modules = [];
const moduleFiles = fs.readdirSync('./modules').filter(file => file.endsWith('.js'));
for (const file of moduleFiles) {
  const mod = await import(`./modules/${file}`);
  modules.push(mod.default);
}

// Load session from PostgreSQL
const savedSession = await getSession();

const client = new Client({
  authStrategy: new LegacySessionAuth({
    session: savedSession
  }),
  puppeteer: {
    args: ['--no-sandbox']
  }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', async (session) => {
  console.log('Authenticated!');
  await saveSession(session);
});

client.on('auth_failure', msg => {
  console.error('AUTH FAILED', msg);
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async message => {
  for (const mod of modules) {
    await mod.execute(client, message);
  }
});

client.initialize();
