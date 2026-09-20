const { query } = require("./pool");
const POSES = require("../data/poseCatalog");

/**
 * Idempotent upsert of the shared pose catalog by unique slug.
 * Safe to run on every migrate/boot so already-seeded DBs still receive new poses.
 */
async function upsertPoses() {
  let upserted = 0;
  for (const pose of POSES) {
    await query(
      `INSERT INTO yoga_poses
        (slug, name, sanskrit_name, category, difficulty, description, instructions, breathing_guidance, caution_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         sanskrit_name = VALUES(sanskrit_name),
         category = VALUES(category),
         difficulty = VALUES(difficulty),
         description = VALUES(description),
         instructions = VALUES(instructions),
         breathing_guidance = VALUES(breathing_guidance),
         caution_notes = VALUES(caution_notes)`,
      [
        pose.slug,
        pose.name,
        pose.sanskrit,
        pose.category,
        pose.difficulty,
        pose.description,
        pose.instructions,
        pose.breathing,
        pose.caution,
      ]
    );
    upserted += 1;
  }
  console.log(`Upserted ${upserted} yoga poses`);
  return upserted;
}

if (require.main === module) {
  upsertPoses()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { upsertPoses };
