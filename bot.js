require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, RemoteAuth } = require("whatsapp-web.js");
const { Pool } = require("pg");
const PostgresStore = require("./postgres-store");
const qrcode = require("qrcode-terminal");

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const store = new PostgresStore({ pool });
const client = new Client({
  authStrategy: new RemoteAuth({
    store: store,
    clientId: "ayus-bot",
  }),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Load all modules
const modules = {};
const modulesPath = path.join(__dirname, "modules");

fs.readdirSync(modulesPath).forEach((file) => {
  if (file.endsWith(".js")) {
    const mod = require(path.join(modulesPath, file));
    if (mod.trigger && typeof mod.handler === "function") {
      modules[mod.trigger.toLowerCase()] = mod.handler;
      console.log(`✅ Loaded module: ${file} (trigger: "${mod.trigger}")`);
    }
  }
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📲 Scan the QR code above with WhatsApp.");
});

client.on("ready", () => {
  console.log("🤖 Bot is ready!");
});

client.on("message", async (msg) => {
  const text = msg.body.toLowerCase();
  if (modules[text]) {
    try {
      await modules[text](msg);
    } catch (err) {
      console.error(`❌ Error in module for trigger "${text}":`, err);
    }
  }
});

client.initialize();
