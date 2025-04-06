const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://ayus2003:Ayus%401311@cluster0.w5fp4ic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Connected to MongoDB');

    const store = new MongoStore({ mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store,
            backupSyncIntervalMs: 300000,
        }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    });

    client.on('qr', (qr) => {
        console.log('📱 QR Code received. Scan it with your WhatsApp:');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('🎉 WhatsApp client is ready!');
    });

    client.on('authenticated', () => console.log('🔐 Client authenticated!'));
    client.on('auth_failure', msg => console.error('❌ Auth failure:', msg));
    client.on('disconnected', reason => console.log('🔌 Disconnected:', reason));

    // Load command modules from ./modules/
    const modulesPath = path.join(__dirname, 'modules');
    fs.readdirSync(modulesPath).forEach(file => {
        if (file.endsWith('.js')) {
            const command = require(path.join(modulesPath, file));
            if (command.name && typeof command.execute === 'function') {
                client.on('message', async (msg) => {
                    const body = msg.body.toLowerCase();
                    if (body === command.name.toLowerCase()) {
                        await command.execute(client, msg);
                    }
                });
                console.log(`✅ Loaded module: ${command.name}`);
            }
        }
    });

    client.initialize();
}).catch(err => console.error('❌ MongoDB connection error:', err));
