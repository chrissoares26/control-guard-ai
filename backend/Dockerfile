FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && ls -la /app/dist/ && test -f /app/dist/main.js

EXPOSE 3000

CMD ["node", "dist/main.js"]
