const bcrypt = require("bcrypt");
const { query, queryOne } = require("./pool");
const configs = require("../configs");

/**
 * Demo instructors upserted on every migrate (and seed), keyed by email.
 * Safe on re-migrate / production Jenkins boots — same idea as upsertPoses.
 */
const DEMO_INSTRUCTORS = [
  {
    email: "lovely@yogastudio.local",
    fullName: "Lovely Kumari",
    displayName: "Lovely Kumari",
    phone: "+917264087089",
    bio: "Yoga instructor welcoming students to accessible, breath-led practice.",
    specialties: "Hatha, Gentle Yoga, Wellness",
    roles: ["instructor", "student"],
  },
];

async function ensureRoles() {
  for (const name of ["student", "instructor", "admin"]) {
    await query(
      "INSERT INTO roles (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)",
      [name, `${name} role`]
    );
  }
}

async function upsertDemoInstructors() {
  await ensureRoles();
  const passwordHash = await bcrypt.hash("DemoPass123!", configs.bcryptRounds);
  let upserted = 0;

  for (const instructor of DEMO_INSTRUCTORS) {
    await query(
      `INSERT INTO users (email, password_hash, full_name, locale, is_active)
       VALUES (?, ?, ?, 'en', 1)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         password_hash = VALUES(password_hash),
         is_active = 1`,
      [instructor.email, passwordHash, instructor.fullName]
    );

    const user = await queryOne("SELECT id FROM users WHERE email = ?", [
      instructor.email,
    ]);
    if (!user) continue;

    for (const roleName of instructor.roles) {
      const role = await queryOne("SELECT id FROM roles WHERE name = ?", [roleName]);
      if (!role) continue;
      await query(
        "INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [user.id, role.id]
      );
    }

    await query(
      `INSERT INTO instructor_profiles (user_id, display_name, bio, specialties, phone, is_active)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         bio = VALUES(bio),
         specialties = VALUES(specialties),
         phone = VALUES(phone),
         is_active = 1`,
      [
        user.id,
        instructor.displayName,
        instructor.bio,
        instructor.specialties,
        instructor.phone,
      ]
    );
    upserted += 1;
  }

  console.log(`Upserted ${upserted} demo instructors`);
  return upserted;
}

if (require.main === module) {
  upsertDemoInstructors()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { upsertDemoInstructors, DEMO_INSTRUCTORS };
