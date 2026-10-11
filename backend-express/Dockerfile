FROM node:24-slim

WORKDIR /app

#Install dependencies
COPY package*.json ./
RUN npm ci

#salin source code
COPY src ./src
COPY docs ./docs
COPY tsconfig.json ./

#folder uploads
RUN mkdir -p public/uploads

ENV NODE_ENV=production
EXPOSE 8000

CMD ["npx", "tsx", "src/server.ts"]