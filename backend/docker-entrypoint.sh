#!/bin/sh
set -e

echo "Yoga Studio API starting…"
echo "DB host=${DATABASE_HOST:-?} port=${DATABASE_PORT:-?} user=${DATABASE_USERNAME:-?} database=${DATABASE_NAME:-?}"

# Fail fast with a clear message (no password logged)
node -e "
const mysql = require('mysql2/promise');
const configs = require('./src/configs');
(async () => {
  try {
    const c = await mysql.createConnection({
      host: configs.db.host,
      port: configs.db.port,
      user: configs.db.user,
      password: configs.db.password,
      database: configs.db.database,
      connectTimeout: 15000,
    });
    const [rows] = await c.query('SELECT 1 AS ok');
    await c.end();
    console.log('DB connection OK');
  } catch (err) {
    console.error('DB connection FAILED:', err.code || '', err.sqlMessage || err.message);
    console.error('If ER_ACCESS_DENIED_ERROR: (1) whitelist this server IP in MySQL Remote Access on the DB host; (2) ensure DATABASE_PASSWORD in the secrets file has NO surrounding quotes (Docker --env-file keeps quotes).');
    process.exit(1);
  }
})();
"

node src/db/migrate.js
exec node src/server.js
