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
let autoDPStarted = false;
let autoBioStarted = false;

const mongoUri = process.env.MONGO_URI;
const authDir = './wahbuddy-auth';
const dbName = 'wahbuddy';
let db, sessionCollection;
let sockInstance = null;

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
    if (attempt < 5) {
      console.warn(`Retrying creds update... attempt ${attempt + 1}`);
      await saveAuthStateToMongo(attempt + 1);
    } else {
      console.error('Failed to update creds in MongoDB after 5 attempts:', err);
    }
  }
}

async function restoreAuthStateFromMongo() {
  console.log('Attempting to restore previous session from MongoDB');

  const savedCreds = await sessionCollection.find({}).toArray();
    
  if (!savedCreds.length) {
    console.warn('No session found in MongoDB. Will require QR login.');
    return;
  } else {
    console.log(`Found WahBuddy's session entries in MongoDB !`);
  }
  
  for (const { _id, data } of savedCreds) {
    fs.mkdirSync(authDir, { recursive: true });
    const filePath = path.join(authDir, _id);    
    fs.writeFileSync(filePath, data, 'utf-8');
  }

  console.log('Session successfully restored from MongoDB');
}

async function startBot() {
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  db = mongoClient.db(dbName);
  sessionCollection = db.collection('wahbuddy_sessions');
  console.log('Connected to MongoDB');

  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
  }

  await restoreAuthStateFromMongo();

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' })
  });

  sockInstance = sock; // Save instance globally

  sock.ev.on('creds.update', async () => {
    await saveCreds(); 
    await saveAuthStateToMongo(); 
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

      // Cleanup previous socket
      if (sockInstance) {
        try {
          sockInstance.ws?.close(); // Gracefully close WebSocket
        } catch (e) {
          console.warn('Error closing socket:', e.message);
        }
        sockInstance = null;
      }

      // Delay restart slightly to avoid race conditions
      setTimeout(() => startBot(), 1000);

    } else if (connection === 'open') {
  console.log('Authenticated with WhatsApp');
  console.log('WhatsApp is ready');

  const autoDP = process.env.ALWAYS_AUTO_DP || 'False';
  const autobio = process.env.ALWAYS_AUTO_BIO || 'False';
  const SHOW_HOROSCOPE = process.env.SHOW_HOROSCOPE || 'False';

  const fakeMessage = {
    key: { remoteJid: sock.user.id },
    pushName: sock.user.name || 'WahBuddy',
    message: {},
    participant: sock.user.id
  };

  if (SHOW_HOROSCOPE !== 'True' && SHOW_HOROSCOPE !== 'False') {
    throw new Error(
      'SHOW_HOROSCOPE must be "True" or "False" (as string). Received: ' + SHOW_HOROSCOPE
    );
  }

  if (autoDP === 'True' && !autoDPStarted) {
    autoDPStarted = true;
    if (commands.has('.autodp')) {
      try {
        await commands.get('.autodp').execute(fakeMessage, [], sock);
        console.log('AutoDP enabled');
      } catch (error) {
        console.error('Failed to enable AutoDP', error);
      }
    } else {
      console.warn('.autodp command not found');
    }
  }

  if (autobio === 'True' && !autoBioStarted) {
    autoBioStarted = true;
    if (commands.has('.autobio')) {
      try {
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
