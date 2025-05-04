FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache git python3 make g++ && \
    ln -sf python3 /usr/bin/python3

RUN npm install --legacy-peer-deps --omit=dev

COPY . .

EXPOSE 8000

CMD ["node", "main.js"]
