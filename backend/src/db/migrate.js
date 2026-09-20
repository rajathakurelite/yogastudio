const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const configs = require("../configs");
const { upsertPoses } = require("./upsertPoses");
const { upsertDemoInstructors } = require("./upsertDemoInstructors");
const { seedMedia } = require("./seedMedia");

async function migrate() {
  const admin = await mysql.createConnection({
    host: configs.db.host,
    port: configs.db.port,
    user: configs.db.user,
    password: configs.db.password,
    multipleStatements: true,
  });

  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${configs.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.query(`USE \`${configs.db.database}\``);
  await admin.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const dir = path.join(__dirname, "../migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const [applied] = await admin.query(
      "SELECT id FROM schema_migrations WHERE filename = ?",
      [file]
    );
    if (applied.length) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await admin.query(sql);
    await admin.query("INSERT INTO schema_migrations (filename) VALUES (?)", [
      file,
    ]);
    console.log(`Applied migration ${file}`);
  }

  await admin.end();

  // Expand pose catalog on already-seeded DBs (idempotent by slug).
  await upsertPoses();
  // Ensure demo instructors exist (idempotent by email) — Jenkins migrate path.
  await upsertDemoInstructors();
  // Ensure default SVG media exists for poses and class cards.
  await seedMedia();
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log("Migrations complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrate };
