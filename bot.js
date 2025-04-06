require('dotenv').config();
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ayus2003:Ayus%401311@cluster0.w5fp4ic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
    console.log('✅ Connected to MongoDB');

    const store = new MongoStore({ mongoose: mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store,
            backupSyncIntervalMs: 300000
        }),
        puppeteer: {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        }
    });

    // Basic debug events
    client.on('qr', (qr) => {
        console.log('📱 QR RECEIVED. Scan this QR with your WhatsApp:');
        console.log(qr);
    });

    client.on('authenticated', () => {
        console.log('🔐 Authenticated successfully.');
    });

    client.on('remote_session_saved', () => {
        console.log('💾 Session saved to MongoDB.');
    });

    client.on('auth_failure', msg => {
        console.error('❌ Authentication failed:', msg);
    });

    client.on('loading_screen', (percent, message) => {
        console.log(`⏳ Loading WhatsApp: ${percent}% - ${message}`);
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp client is ready!');
    });

    client.on('disconnected', (reason) => {
        console.log('⚠️ Client was disconnected:', reason);
    });

    // Timeout checker if stuck
    setTimeout(() => {
        console.log('⌛ Still waiting for client to be ready... Maybe Chromium is stuck?');
    }, 60000); // 60 seconds

    // Load command modules dynamically
    const modulesPath = path.join(__dirname, 'modules');
    fs.readdir(modulesPath, (err, files) => {
        if (err) {
            console.error('❌ Error reading modules:', err);
            return;
        }
        files.forEach(file => {
            if (file.endsWith('.js')) {
                const modulePath = path.join(modulesPath, file);
                require(modulePath)(client);
                console.log(`✅ Loaded module: ${file}`);
            }
        });
    });

    client.initialize();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});
