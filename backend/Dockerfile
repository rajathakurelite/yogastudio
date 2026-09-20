FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
EXPOSE 2005
CMD ["sh", "-c", "node src/db/migrate.js && node src/db/seed.js && node src/server.js"]
