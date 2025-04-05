# WhatsApp Userbot

A simple WhatsApp userbot using `whatsapp-web.js` with persistent session via PostgreSQL. Designed to run on Railway (free tier).

## Features
- Persistent login (no QR after first time)
- Modular commands system
- PostgreSQL session store
- Easy deployment on Railway

## Deploy
1. Push code to GitHub
2. Go to [https://railway.app](https://railway.app)
3. Create new project → Deploy from GitHub
4. Add PostgreSQL plugin
5. Paste `DATABASE_URL` into variables
6. Start → Scan QR → Done ✅
