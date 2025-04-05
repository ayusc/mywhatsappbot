// bot.js
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const { Client, LocalAuth } = require('whatsapp-web.js');
const modulesDir = path.join(__dirname, 'modules');

const sessionTar = path.join(__dirname, 'session.tar.gz');
const sessionFolder = path.join(__dirname, '.wwebjs_auth');

// Extract session archive if not already restored
async function restoreSession() {
    if (!fs.existsSync(sessionFolder) && fs.existsSync(sessionTar)) {
        console.log('📦 Extracting session.tar.gz...');
        await tar.x({ file: sessionTar, C: __dirname });
        console.log('✅ Session extracted successfully.');
    }
}

// Load all modules from /modules
function loadModules(client, msg) {
    fs.readdirSync(modulesDir).forEach(file => {
        if (file.endsWith('.js')) {
            const handler = require(path.join(modulesDir, file));
            handler(client, msg);
        }
    });
}

// Start bot
async function startBot() {
    await restoreSession();

    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: '.wwebjs_auth'
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('📸 QR RECEIVED (this should only show once if session not restored)');
        require('qrcode-terminal').generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('🤖 Bot is ready!');
    });

    client.on('message', async (msg) => {
        loadModules(client, msg); // Run all command modules
    });

    client.initialize();
}

startBot();
