FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 8000

CMD ["node", "main.js"]
