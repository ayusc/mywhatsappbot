FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y git

RUN npm install --production --legacy-peer-deps

COPY . .

EXPOSE 8000

CMD ["node", "main.js"]
