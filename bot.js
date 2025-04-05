const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const sessionUrl = process.env.DRIVE_SESSION_URL;
const sessionZipPath = path.join(__dirname, 'session.zip');
const sessionFolder = path.join(__dirname, '.wwebjs_auth');
const modulesPath = path.join(__dirname, 'modules');

async function downloadSessionZip() {
    if (fs.existsSync(sessionFolder)) {
        console.log('✅ Session folder exists. Skipping download.');
        return;
    }

    if (!sessionUrl) {
        console.error('❌ DRIVE_SESSION_URL is not set.');
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

function extractSession() {
    if (fs.existsSync(sessionFolder)) return;

    console.log('📦 Extracting session.zip...');
    const zip = new AdmZip(sessionZipPath);
    zip.extractAllTo(__dirname, true);
    console.log('✅ Session restored.');
}

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

    client.on('qr', (qr) => {
        console.log('⚠️  QR Required:\n');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('🤖 Bot is ready!');
    });

    client.on('message', async (msg) => {
        const args = msg.body.trim().split(/\s+/);
        const command = args.shift().toLowerCase();
        const commandPath = path.join(modulesPath, `${command}.js`);

        if (fs.existsSync(commandPath)) {
            const handler = require(commandPath);
            if (typeof handler === 'function') {
                handler(client, msg, args);
            }
        }
    });

    client.initialize();
}

startBot().catch(console.error);
