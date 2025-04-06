require('dotenv').config();
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log('✅ Connected to MongoDB');

    const store = new MongoStore({ mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store,
            backupSyncIntervalMs: 300000
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=site-per-process',
                '--single-process'
            ]
        }
    });

    // Load modules
    const modulesPath = path.join(__dirname, 'modules');
    fs.readdir(modulesPath, (err, files) => {
        if (err) return console.error('❌ Error loading modules:', err);
        files.filter(file => file.endsWith('.js')).forEach(file => {
            const modulePath = path.join(modulesPath, file);
            const mod = require(modulePath);
            if (typeof mod === 'function') {
                mod(client);
                console.log(`✅ Loaded module: ${file}`);
            } else {
                console.warn(`⚠️ Skipped module (not a function): ${file}`);
            }
        });
    });

    client.on('qr', qr => {
        console.log('📱 QR RECEIVED. Scan this QR with your WhatsApp:');
        console.log(qr);
    });

    client.on('authenticated', () => {
        console.log('🔐 Authenticated successfully.');
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp client is ready!');
    });

    client.on('auth_failure', msg => {
        console.error('❌ Authentication failed:', msg);
    });

    client.on('disconnected', reason => {
        console.log('❌ Client disconnected:', reason);
    });

    client.initialize();
});
