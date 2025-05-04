import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import pino from 'pino';
import express from 'express';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mongoUri = process.env.MONGO_URI;
const authDir = './wahbuddy-auth';
const dbName = 'wahbuddy';
let db, sessionCollection;

async function saveAuthStateToMongo(attempt = 1) {
  try {
    const staging = db.collection('wahbuddy_sessions_staging');
    const main = sessionCollection;

    const files = fs.readdirSync(authDir);
    for (const file of files) {
      const filePath = path.join(authDir, file);
      const data = fs.readFileSync(filePath, 'utf-8');

      await staging.updateOne(
        { _id: file },
        { $set: { data } },
        { upsert: true }
      );
    }

    const staged = await staging.find({}).toArray();
    for (const doc of staged) {
      await main.updateOne(
        { _id: doc._id },
        { $set: { data: doc.data } },
        { upsert: true }
      );
    }

    await staging.deleteMany({});
  } catch (err) {
    if (attempt < 3) {
      console.warn(`Retrying creds update... attempt ${attempt + 1}`);
      await saveAuthStateToMongo(attempt + 1);
    } else {
      console.error('Failed to update creds in MongoDB after 3 attempts:', err);
    }
  }
}

async function restoreAuthStateFromMongo() {
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);

  const existingFiles = fs.readdirSync(authDir);
  if (existingFiles.length > 0) return;

  const savedCreds = await sessionCollection.find({}).toArray();
  if (!savedCreds.length) {
    console.warn('No session found in MongoDB. Will require QR login.');
    return;
  }

  for (const { _id, data } of savedCreds) {
    const filePath = path.join(authDir, _id);
    fs.writeFileSync(filePath, data, 'utf-8');
  }

  console.log('Session restored from MongoDB');
}

async function startBot() {
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  db = mongoClient.db(dbName);
  sessionCollection = db.collection('wahbuddy_sessions');
  console.log('Connected to MongoDB');

  await restoreAuthStateFromMongo();
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'warn' })
  });

  // Update credentials locally + to Mongo
  sock.ev.on('creds.update', async () => {
    await saveCreds(); // must call this for Baileys to be stable
    await saveAuthStateToMongo(); // MongoDB backup
  });

  const commands = new Map();
  const modulesPath = path.join(__dirname, 'modules');
  const moduleFiles = fs.readdirSync(modulesPath).filter(file => file.endsWith('.js'));

  for (const file of moduleFiles) {
    const module = await import(`./modules/${file}`);
    if (module.default?.name && module.default?.execute) {
      commands.set(module.default.name, module.default);
      console.log(`Loaded command: ${module.default.name}`);
    } else {
      console.warn(`Skipped invalid module: ${file}`);
    }
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('Scan the QR code below:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
  const statusCode = lastDisconnect?.error instanceof Boom
    ? lastDisconnect.error.output.statusCode
    : undefined;

  const isLoggedOut = statusCode === DisconnectReason.loggedOut;

  console.log('Connection closed. Logged out:', isLoggedOut);

  if (isLoggedOut) {
    console.log('Session is invalid. Clearing local auth state...');
    fs.rmSync(authDir, { recursive: true, force: true });
  }

  startBot();
}

    } else if (connection === 'open') {
      console.log('Authenticated with WhatsApp');
      console.log('WhatsApp is ready');

      const autoDP = process.env.ALWAYS_AUTO_DP || 'False';
      const autobio = process.env.ALWAYS_AUTO_BIO || 'False';
      const SHOW_HOROSCOPE = process.env.SHOW_HOROSCOPE || 'False';

      if (SHOW_HOROSCOPE !== 'True' && SHOW_HOROSCOPE !== 'False') {
        throw new Error(
          'SHOW_HOROSCOPE must be "True" or "False" (as string). Received: ' + SHOW_HOROSCOPE
        );
      }

      if (autoDP === 'True') {
        if (commands.has('.autodp')) {
          try {
            const fakeMessage = {
              key: { remoteJid: sock.user.id, fromMe: true },
              message: { conversation: '.autodp' }
            };
            await commands.get('.autodp').execute(fakeMessage, [], sock);
            console.log('AutoDP enabled');
          } catch (error) {
            console.error('Failed to enable AutoDP', error);
          }
        } else {
          console.warn('.autodp command not found');
        }
      }

      if (autobio === 'True') {
        if (commands.has('.autobio')) {
          try {
            const fakeMessage = {
              key: { remoteJid: sock.user.id, fromMe: true },
              message: { conversation: '.autobio' }
            };
            await commands.get('.autobio').execute(fakeMessage, [], sock);
            console.log('AutoBio enabled');
          } catch (error) {
            console.error('Failed to enable AutoBio', error);
          }
        } else {
          console.warn('.autobio command not found');
        }
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages || !messages.length) return;

    const msg = messages[0];
    if (!msg.message || !msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const messageContent =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      '';

    const args = messageContent.trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (commands.has(command)) {
      try {
        await commands.get(command).execute(msg, args, sock);
      } catch (err) {
        console.error(`Error executing ${command}:`, err);
      }
    }
  });
}


// Setting up minimal server for WahBuddy
const app = express();
const PORT = process.env.PORT || 8000;
const SITE_URL = process.env.SITE_URL;

app.get('/', (req, res) => {
  res.json({ status: 'Running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`HTTP server running on ${SITE_URL}`);
});

function startSelfPing() {
  setInterval(async () => {
    try {
      await axios.get(`https://${SITE_URL}/health`);
    } catch (err) {
      console.error('Error in HTTP server:', err.message);
    }
  }, 60 * 1000); 
}

startBot();
startSelfPing();
