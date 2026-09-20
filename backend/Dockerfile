FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p storage/media
EXPOSE 2005
# Migrate on boot; seed is one-shot (npm run seed) — do not re-seed every deploy.
CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]
