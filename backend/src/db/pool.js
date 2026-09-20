const mysql = require("mysql2/promise");
const configs = require("../configs");
const logger = require("../utils/logger");

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: configs.db.host,
      port: configs.db.port,
      user: configs.db.user,
      password: configs.db.password,
      database: configs.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      charset: "utf8mb4",
      timezone: "Z",
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function withTransaction(work) {
  const conn = await getPool().getConnection();
  await conn.beginTransaction();
  try {
    const tx = {
      query: async (sql, params = []) => {
        const [rows] = await conn.execute(sql, params);
        return rows;
      },
      queryOne: async (sql, params = []) => {
        const [rows] = await conn.execute(sql, params);
        return rows[0] || null;
      },
    };
    const result = await work(tx);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    logger.error({ err: err.message }, "transaction rolled back");
    throw err;
  } finally {
    conn.release();
  }
}

async function ping() {
  const conn = await getPool().getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { getPool, query, queryOne, withTransaction, ping };
