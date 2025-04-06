require('dotenv').config();
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ayus2003:Ayus%401311@cluster0.w5fp4ic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('✅ Connected to MongoDB');

    const store = new MongoStore({ mongoose: mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000,
        }),
        puppeteer: {
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // Event Listeners
    client.on('qr', (qr) => {
        console.log('📱 QR RECEIVED. Use a terminal scanner or setup a headless GUI to scan.');
        // Optionally, generate a QR file here
    });

    client.on('authenticated', () => {
        console.log('🔐 Authenticated successfully.');
    });

    client.on('auth_failure', msg => {
        console.error('❌ Authentication failure:', msg);
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp client is ready!');
    });

    client.on('disconnected', (reason) => {
        console.log('🔌 Client disconnected:', reason);
    });

    // Initialize bot
    client.initialize();

    // Load command modules
    const modulesPath = path.join(__dirname, 'modules');
    if (fs.existsSync(modulesPath)) {
        fs.readdirSync(modulesPath).forEach(file => {
            if (file.endsWith('.js')) {
                const module = require(path.join(modulesPath, file));
                if (typeof module === 'function') {
                    module(client);
                    console.log(`📦 Loaded module: ${file}`);
                }
            }
        });
    }
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});
