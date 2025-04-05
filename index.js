const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Optional: Restore LocalAuth from base64-encoded LOCALAUTH_DATA
const localAuthPath = './.wwebjs_auth';
if (process.env.LOCALAUTH_DATA) {
    const decoded = Buffer.from(process.env.LOCALAUTH_DATA, 'base64');
    fs.mkdirSync(localAuthPath, { recursive: true });
    fs.writeFileSync(path.join(localAuthPath, 'session'), decoded);
}

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: localAuthPath.replace('./', ''),
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Event: Ready
client.on('ready', () => {
    console.log('✅ WhatsApp bot is ready!');
});

// Event: Message
client.on('message', async (msg) => {
    if (msg.body.toLowerCase() === 'hi') {
        await msg.reply('Hello! 👋');
    }

    // Load modules dynamically from modules folder
    const modulesPath = path.join(__dirname, 'modules');
    if (fs.existsSync(modulesPath)) {
        const files = fs.readdirSync(modulesPath);
        for (const file of files) {
            if (file.endsWith('.js')) {
                const module = require(path.join(modulesPath, file));
                if (typeof module === 'function') {
                    await module(client, msg);
                }
            }
        }
    }
});

// Start client
client.initialize();
