// bot.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { Client, LocalAuth } = require('whatsapp-web.js');

const sessionZipUrl = process.env.DRIVE_SESSION_URL;
const zipPath = path.join(__dirname, 'session.zip');
const extractPath = path.join(__dirname, '.wwebjs_auth');

async function downloadZip(url, dest) {
    console.log('🌐 Downloading session zip from Google Drive...');
    const response = await axios({ url, responseType: 'arraybuffer' });
    fs.writeFileSync(dest, response.data);
    console.log('✅ Downloaded session.zip');
}

async function extractZip(zipFile, destination) {
    console.log('🗂️ Extracting zip...');
    const zip = new AdmZip(zipFile);
    zip.extractAllTo(destination, true);
    console.log('✅ Extracted session to .wwebjs_auth');
}

async function prepareSession() {
    if (!fs.existsSync(extractPath)) {
        if (!sessionZipUrl) {
            console.error('❌ Missing DRIVE_SESSION_URL environment variable.');
            process.exit(1);
        }

        await downloadZip(sessionZipUrl, zipPath);
        await extractZip(zipPath, __dirname);
        fs.unlinkSync(zipPath); // cleanup
    } else {
        console.log('📁 Session already exists, skipping download.');
    }
}

async function startBot() {
    await prepareSession();

    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: '.wwebjs_auth'
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('ready', () => {
        console.log('🤖 Bot is ready!');
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ Authentication failed:', msg);
    });

    client.on('message', async (msg) => {
        if (msg.body.toLowerCase() === '!ping') {
            msg.reply('Pong!');
        }
    });

    client.initialize();
}

startBot();
