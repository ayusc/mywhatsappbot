# Use official Node 18 base image
FROM node:18-slim

# Install necessary dependencies for Chromium
RUN apt-get update && apt-get install -y \
    wget \
    git \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    libpango-1.0-0 \
    libxss1 \
    lsb-release \
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files & install deps
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Start the bot
CMD ["node", "bot.js"]
