FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm cache clean

RUN npm install --production --legacy-peer-deps

COPY . .

EXPOSE 8000

CMD ["node", "main.js"]
