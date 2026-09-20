const bcrypt = require("bcrypt");
const { queryOne, withTransaction } = require("./pool");
const configs = require("../configs");
const POSES = require("../data/poseCatalog");
const { upsertPoses } = require("./upsertPoses");
const { seedMedia } = require("./seedMedia");

const STYLES = [
  ["hatha", "Hatha", "Steady alignment-focused practice"],
  ["vinyasa", "Vinyasa", "Breath-linked flowing movement"],
  ["power-yoga", "Power Yoga", "Energetic strength-oriented flow"],
  ["yin", "Yin", "Long-held floor postures"],
  ["restorative", "Restorative", "Supported rest and recovery"],
  ["ashtanga", "Ashtanga", "Set progressive series"],
  ["kundalini", "Kundalini", "Breath, mantra and kriya"],
  ["gentle-yoga", "Gentle Yoga", "Soft accessible movement"],
  ["morning-yoga", "Morning Yoga", "Wake-up energy and breath"],
  ["prenatal-yoga", "Prenatal Yoga", "Pregnancy-aware gentle practice"],
];

const GOALS = [
  ["flexibility", "Flexibility", "Ease and range of motion"],
  ["stress-relief", "Stress Relief", "Calm the nervous system"],
  ["strength", "Strength", "Build steady physical strength"],
  ["relaxation", "Relaxation", "Rest and restore"],
  ["mobility", "Mobility", "Joint-friendly movement"],
  ["balance", "Balance", "Stability and focus"],
  ["general-wellness", "General Wellness", "Everyday well-being"],
  ["morning-energy", "Morning Energy", "Start the day with breath and movement"],
  ["better-sleep", "Better Sleep", "Wind-down evening practice"],
];

async function seed() {
  // Always expand/refresh the shared pose catalog (idempotent by slug).
  await upsertPoses();

  const existing = await queryOne("SELECT id FROM users WHERE email = ?", [
    "admin@yogastudio.local",
  ]);
  if (existing) {
    console.log("Seed already applied — refreshing media assets");
    await seedMedia();
    return;
  }

  const passwordHash = await bcrypt.hash("DemoPass123!", configs.bcryptRounds);

  await withTransaction(async (tx) => {
    for (const name of ["student", "instructor", "admin"]) {
      await tx.query(
        "INSERT INTO roles (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)",
        [name, `${name} role`]
      );
    }

    const insertUser = async (email, name) => {
      const result = await tx.query(
        "INSERT INTO users (email, password_hash, full_name, locale) VALUES (?, ?, ?, ?)",
        [email, passwordHash, name, "en"]
      );
      return result.insertId;
    };

    const adminId = await insertUser("admin@yogastudio.local", "Studio Admin");
    const instructorId = await insertUser(
      "instructor@yogastudio.local",
      "Asha Rao"
    );
    const studentId = await insertUser(
      "student@yogastudio.local",
      "Maya Chen"
    );

    const role = async (name) =>
      tx.queryOne("SELECT id FROM roles WHERE name = ?", [name]);

    const studentRole = await role("student");
    const instructorRole = await role("instructor");
    const adminRole = await role("admin");

    await tx.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [
      adminId,
      adminRole.id,
    ]);
    await tx.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [
      instructorId,
      instructorRole.id,
    ]);
    await tx.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [
      instructorId,
      studentRole.id,
    ]);
    await tx.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [
      studentId,
      studentRole.id,
    ]);

    await tx.query(
      "INSERT INTO instructor_profiles (user_id, display_name, bio, specialties) VALUES (?, ?, ?, ?)",
      [
        instructorId,
        "Asha Rao",
        "Hatha and vinyasa instructor focused on breath-led, accessible classes.",
        "Hatha, Vinyasa, Morning Yoga",
      ]
    );

    for (const [slug, name, description] of STYLES) {
      await tx.query(
        "INSERT INTO yoga_styles (slug, name, description) VALUES (?, ?, ?)",
        [slug, name, description]
      );
    }
    for (const [slug, name, description] of GOALS) {
      await tx.query(
        "INSERT INTO yoga_goals (slug, name, description) VALUES (?, ?, ?)",
        [slug, name, description]
      );
    }
    // Poses are upserted via upsertPoses() before this transaction.

    const hatha = await tx.queryOne("SELECT id FROM yoga_styles WHERE slug = ?", [
      "hatha",
    ]);
    const wellness = await tx.queryOne(
      "SELECT id FROM yoga_goals WHERE slug = ?",
      ["general-wellness"]
    );

    const classResult = await tx.query(
      `INSERT INTO yoga_classes
        (instructor_user_id, instructor_display_name, title, description, duration_minutes, level, style_id, goal_id, language, status, is_daily, safety_guidance, objectives, published_at, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, ?, ?, NOW(), ?)`,
      [
        instructorId,
        "Asha Rao",
        "Morning Balance Flow",
        "A 30-minute breath-led hatha class to start the day with movement, breath and balance. This is a general wellness practice, not medical treatment.",
        30,
        "beginner",
        hatha.id,
        wellness.id,
        "en",
        "Move within a comfortable range. Stop if you feel pain or dizziness. Consult a qualified professional for personal health questions.",
        "Wake the body, settle the breath, and leave feeling steadier.",
        adminId,
      ]
    );
    const classId = classResult.insertId;
    const seq = await tx.query(
      "INSERT INTO yoga_class_sequences (class_id, version, generated_by) VALUES (?, 1, 'seed')",
      [classId]
    );
    const sequenceId = seq.insertId;
    const seededSequence = [
      ["centering", "Centering", "Dhyana", "pose", 120],
      ["pranayama", "Pranayama", "Pranayama", "breathing", 180],
      ["cat-cow", "Cat-Cow", "Marjaryasana-Bitilasana", "pose", 120],
      ["downward-dog", "Downward-Facing Dog", "Adho Mukha Svanasana", "pose", 120],
      ["surya-namaskar", "Surya Namaskar", "Surya Namaskar", "pose", 300],
      ["warrior-ii", "Warrior II", "Virabhadrasana II", "pose", 180],
      ["tree-pose", "Tree Pose", "Vrksasana", "pose", 120],
      ["seated-forward-fold", "Seated Forward Fold", "Paschimottanasana", "pose", 180],
      ["child-pose", "Child's Pose", "Balasana", "rest", 180],
      ["shavasana", "Shavasana", "Savasana", "pose", 300],
    ];
    let order = 1;
    for (const [slug, name, sanskrit, type, seconds] of seededSequence) {
      const pose = await tx.queryOne("SELECT id FROM yoga_poses WHERE slug = ?", [
        slug,
      ]);
      await tx.query(
        `INSERT INTO yoga_class_sequence_items
          (sequence_id, pose_id, sort_order, item_type, name, sanskrit_name, duration_seconds, instructions, breathing_guidance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sequenceId,
          pose?.id || null,
          order++,
          type,
          name,
          sanskrit,
          seconds,
          pose
            ? (
                await tx.queryOne(
                  "SELECT instructions FROM yoga_poses WHERE id = ?",
                  [pose.id]
                )
              ).instructions
            : "",
          pose
            ? (
                await tx.queryOne(
                  "SELECT breathing_guidance FROM yoga_poses WHERE id = ?",
                  [pose.id]
                )
              ).breathing_guidance
            : "",
        ]
      );
    }

    await tx.query(
      `INSERT INTO class_schedules (class_id, instructor_user_id, starts_at, duration_minutes, visibility)
       VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 7 HOUR), 30, 'public')`,
      [classId, instructorId]
    );
  });

  // Always ensure pose images + class thumbnails exist (idempotent).
  await seedMedia();

  console.log("Seed complete");
  console.log("Demo logins (password: DemoPass123!)");
  console.log("  admin@yogastudio.local");
  console.log("  instructor@yogastudio.local");
  console.log("  student@yogastudio.local");
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seed, POSES, STYLES, GOALS };
