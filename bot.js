require('dotenv').config();
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const PostgresStore = require('./postgres-store');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
    const store = new PostgresStore({ session: process.env.SESSION_ID });
    await store.init();

    const client = new Client({
        authStrategy: new RemoteAuth({
        store,
        backupSyncIntervalMs: 120000
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });
    
    client.on('qr', (qr) => {
        console.log('📲 Scan this QR code to log in:\n');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('✅ Bot is ready!');
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ Auth failure:', msg);
    });

    client.on('disconnected', (reason) => {
        console.log('🔌 Disconnected:', reason);
    });

    // Load modules
    const modulesPath = path.join(__dirname, 'modules');
    fs.readdirSync(modulesPath).forEach(file => {
        const module = require(path.join(modulesPath, file));
        if (module && module.trigger && module.handler) {
            client.on('message', async msg => {
                if (msg.body.toLowerCase() === module.trigger.toLowerCase()) {
                    await module.handler(client, msg);
                }
            });
            console.log(`✅ Loaded module: ${file} (trigger: "${module.trigger}")`);
        }
    });

    client.initialize();
})();
