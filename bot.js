const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('✅ Connected to MongoDB');

    // Create session store
    const store = new MongoStore({ mongoose });

    // Initialize client with puppeteer-core & system Chromium
    const client = new Client({
        puppeteer: {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        authStrategy: new RemoteAuth({
            store,
            backupSyncIntervalMs: 300000
        })
    });

    // Initialize client
    client.initialize();

    client.on('qr', (qr) => {
        console.log('📱 QR RECEIVED. Scan this QR with your WhatsApp:');
        console.log(qr);
    });

    client.on('ready', () => {
        console.log('✅ Client is ready!');
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ Authentication failure:', msg);
    });

    // Load modules
    const modulesPath = path.join(__dirname, 'modules');
    const modules = [];

    fs.readdirSync(modulesPath).forEach(file => {
        if (file.endsWith('.js')) {
            const module = require(path.join(modulesPath, file));
            modules.push(module);
        }
    });

    // Handle messages
    client.on('message', async (message) => {
        for (const mod of modules) {
            if (typeof mod.handle === 'function') {
                await mod.handle(client, message);
            }
        }
    });
});
