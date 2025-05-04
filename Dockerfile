FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 8000

CMD ["node", "main.js"]
