import fs from 'fs';
import path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load .env
config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct download URL of session.zip
const sessionUrl = process.env.DRIVE_SESSION_URL;
const sessionZipPath = path.join(__dirname, 'session.zip');
const sessionFolder = path.join(__dirname, '.wwebjs_auth');

// Ensure modules folder exists
const modulesPath = path.join(__dirname, 'modules');

// STEP 1: Download the session.zip file
async function downloadSessionZip() {
    if (fs.existsSync(sessionFolder)) {
        console.log('✅ Session folder already exists. Skipping download.');
        return;
    }

    if (!sessionUrl) {
        console.error('❌ DRIVE_SESSION_URL not set in .env');
        process.exit(1);
    }

    console.log('⬇️  Downloading session.zip from Drive...');

    const writer = fs.createWriteStream(sessionZipPath);
    const response = await axios.get(sessionUrl, { responseType: 'stream' });

    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// STEP 2: Extract the session.zip file
function extractSession() {
    if (fs.existsSync(sessionFolder)) return;

    console.log('📦 Extracting session.zip...');
    const zip = new AdmZip(sessionZipPath);
    zip.extractAllTo(__dirname, true);
    console.log('✅ Session restored.');
}

// STEP 3: Initialize WhatsApp client
async function startBot() {
    await downloadSessionZip();
    extractSession();

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: sessionFolder }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // Handle QR if session fails (optional fallback)
    client.on('qr', (qr) => {
        console.log('⚠️  Session not valid. New QR required:\n');
        import('qrcode-terminal').then(qrterm => qrterm.default.generate(qr, { small: true }));
    });

    client.on('ready', () => {
        console.log('🤖 Bot is ready!');
    });

    client.on('message', async (msg) => {
        const args = msg.body.trim().split(/\s+/);
        const command = args.shift().toLowerCase();

        const commandPath = path.join(modulesPath, `${command}.js`);
        if (fs.existsSync(commandPath)) {
            const handler = await import(`./modules/${command}.js`);
            if (handler.default) handler.default(client, msg, args);
        }
    });

    client.initialize();
}

startBot().catch(err => {
    console.error('❌ Failed to start bot:', err);
});
