const bcrypt = require("bcrypt");
const { query, queryOne, withTransaction } = require("./pool");
const configs = require("../configs");

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

const POSES = [
  {
    slug: "centering",
    name: "Centering",
    sanskrit: "Dhyana",
    category: "Relaxation",
    difficulty: "beginner",
    description: "A seated pause to arrive, notice the breath, and set an intention.",
    instructions: "Sit comfortably. Soften the gaze or close the eyes. Feel the sit bones and lengthen the spine.",
    breathing: "Natural, unforced breath through the nose.",
    caution: "Sit on a cushion if the hips or knees feel compressed.",
  },
  {
    slug: "pranayama",
    name: "Pranayama",
    sanskrit: "Pranayama",
    category: "Breathing",
    difficulty: "beginner",
    description: "Guided breathing to settle attention before movement.",
    instructions: "Lengthen the inhale and exhale evenly. Keep the shoulders relaxed.",
    breathing: "Slow nasal breathing. Never force or hold the breath uncomfortably.",
    caution: "Stop if you feel dizzy or light-headed.",
  },
  {
    slug: "cat-cow",
    name: "Cat-Cow",
    sanskrit: "Marjaryasana-Bitilasana",
    category: "Sitting",
    difficulty: "beginner",
    description: "Gentle spinal waves to warm the back.",
    instructions: "On all fours, inhale to lift the chest, exhale to round the spine.",
    breathing: "Inhale for cow, exhale for cat.",
    caution: "Keep wrists stacked under shoulders; pad the knees if needed.",
  },
  {
    slug: "downward-dog",
    name: "Downward-Facing Dog",
    sanskrit: "Adho Mukha Svanasana",
    category: "Standing",
    difficulty: "beginner",
    description: "An inverted V-shape that lengthens the back body.",
    instructions: "Hands and feet on the mat, hips lift. Bend the knees as much as you need.",
    breathing: "Steady breath; take a rest in child's pose whenever you like.",
    caution: "Avoid dumping into the shoulders. Skip or modify if you have wrist or uncontrolled high blood pressure concerns — this is general guidance, not medical advice.",
  },
  {
    slug: "surya-namaskar",
    name: "Surya Namaskar",
    sanskrit: "Surya Namaskar",
    category: "Standing",
    difficulty: "intermediate",
    description: "A repeating sun-salutation cycle to build warmth.",
    instructions: "Move with the breath through a sun-salutation variation appropriate to the level.",
    breathing: "One breath per movement where possible.",
    caution: "Reduce range or skip chaturanga if the shoulders fatigue.",
  },
  {
    slug: "warrior-ii",
    name: "Warrior II",
    sanskrit: "Virabhadrasana II",
    category: "Standing",
    difficulty: "beginner",
    description: "A strong standing lunge with open hips and arms.",
    instructions: "Front knee tracks over the ankle. Gaze past the front fingertips.",
    breathing: "Even inhales and exhales to stay steady.",
    caution: "Shorten the stance if the front knee feels strained.",
  },
  {
    slug: "tree-pose",
    name: "Tree Pose",
    sanskrit: "Vrksasana",
    category: "Balance",
    difficulty: "beginner",
    description: "A standing balance on one leg.",
    instructions: "Place the foot on the ankle, calf, or inner thigh — never on the knee. Use a wall if useful.",
    breathing: "Slow breathing to find stillness.",
    caution: "Keep a soft gaze. Come down if you feel unstable.",
  },
  {
    slug: "seated-forward-fold",
    name: "Seated Forward Fold",
    sanskrit: "Paschimottanasana",
    category: "Forward Fold",
    difficulty: "beginner",
    description: "A seated fold to lengthen the back body.",
    instructions: "Hinge from the hips. Keep a long spine rather than rounding to reach the feet.",
    breathing: "Inhale to lengthen, exhale to fold gently.",
    caution: "Bend the knees generously. This is not a stretch contest.",
  },
  {
    slug: "child-pose",
    name: "Child's Pose",
    sanskrit: "Balasana",
    category: "Relaxation",
    difficulty: "beginner",
    description: "A resting fold used as a home base throughout class.",
    instructions: "Knees together or apart, hips toward heels, forehead toward the mat.",
    breathing: "Soft belly breathing.",
    caution: "Widen the knees or add a cushion under the hips if needed.",
  },
  {
    slug: "mountain-pose",
    name: "Mountain Pose",
    sanskrit: "Tadasana",
    category: "Standing",
    difficulty: "beginner",
    description: "Standing alignment and awareness.",
    instructions: "Feet grounded, spine tall, shoulders relaxed, arms alongside the body.",
    breathing: "Natural breath, noticing the feet.",
    caution: "Stand near a wall if balance feels uncertain.",
  },
  {
    slug: "low-lunge",
    name: "Low Lunge",
    sanskrit: "Anjaneyasana",
    category: "Standing",
    difficulty: "beginner",
    description: "A kneeling lunge that opens the front of the hip.",
    instructions: "Back knee down, front knee stacked over the ankle. Hands on the front thigh or lifted.",
    breathing: "Steady breath into the front of the back hip.",
    caution: "Pad the back knee. Keep the front knee tracking with the second toe.",
  },
  {
    slug: "bridge-pose",
    name: "Bridge Pose",
    sanskrit: "Setu Bandha Sarvangasana",
    category: "Backbend",
    difficulty: "beginner",
    description: "A gentle supine backbend.",
    instructions: "Feet hip-width, press into the feet to lift the hips. Keep the neck long.",
    breathing: "Inhale to lift, exhale to stay or lower.",
    caution: "Do not turn the head while lifted. Lower if there is neck discomfort.",
  },
  {
    slug: "supine-twist",
    name: "Supine Twist",
    sanskrit: "Supta Matsyendrasana",
    category: "Twist",
    difficulty: "beginner",
    description: "A reclined spinal twist.",
    instructions: "Knees can stay together. Let them fall to one side. Gaze opposite or wherever the neck is happy.",
    breathing: "Exhale to soften into the twist.",
    caution: "Keep the twist gentle. Come out if you feel pinching.",
  },
  {
    slug: "legs-up-the-wall",
    name: "Legs Up the Wall",
    sanskrit: "Viparita Karani",
    category: "Relaxation",
    difficulty: "beginner",
    description: "A restorative inversion variation with legs elevated.",
    instructions: "Hips near or slightly away from the wall, legs resting up. Stay for several breaths.",
    breathing: "Quiet, natural breath.",
    caution: "Skip if this position feels uncomfortable. This is wellness rest, not medical treatment.",
  },
  {
    slug: "shavasana",
    name: "Shavasana",
    sanskrit: "Savasana",
    category: "Relaxation",
    difficulty: "beginner",
    description: "Final rest lying on the back.",
    instructions: "Lie down, arms slightly away from the body, palms easy. Let the practice settle.",
    breathing: "Natural breath. Nothing to do.",
    caution: "Lie on your side if lying on the back is uncomfortable.",
  },
  {
    slug: "chair-pose",
    name: "Chair Pose",
    sanskrit: "Utkatasana",
    category: "Standing",
    difficulty: "intermediate",
    description: "A standing squat that builds heat in the legs.",
    instructions: "Sit back as if toward a chair, weight in the heels, spine long.",
    breathing: "Steady breath; ease out if the breath becomes strained.",
    caution: "Keep knees tracking over the toes. Reduce the depth as needed.",
  },
  {
    slug: "triangle-pose",
    name: "Triangle Pose",
    sanskrit: "Trikonasana",
    category: "Standing",
    difficulty: "intermediate",
    description: "A wide-legged standing pose with a long side body.",
    instructions: "Front foot forward, back foot slightly turned in. Hinge and reach, hand to shin, block, or floor.",
    breathing: "Breathe into the top side of the ribcage.",
    caution: "A block under the bottom hand is welcome. Avoid locking the front knee.",
  },
  {
    slug: "cobra-pose",
    name: "Cobra Pose",
    sanskrit: "Bhujangasana",
    category: "Backbend",
    difficulty: "beginner",
    description: "A prone backbend to open the chest.",
    instructions: "Hands under the shoulders, press lightly, lift the chest, keep the pelvis grounded.",
    breathing: "Inhale to lift, exhale to soften the shoulders.",
    caution: "Keep the lift small. Stop if there is low-back compression.",
  },
  {
    slug: "pigeon-pose",
    name: "Pigeon Pose",
    sanskrit: "Eka Pada Rajakapotasana",
    category: "Sitting",
    difficulty: "intermediate",
    description: "A hip opener with one leg folded forward.",
    instructions: "Front shin as parallel as is comfortable. Keep the hips level. Fold forward if it feels good.",
    breathing: "Slow breath into the outer hip.",
    caution: "Use a blanket under the hip. Switch to figure-four on the back if the knee complains.",
  },
  {
    slug: "easy-seat",
    name: "Easy Seat",
    sanskrit: "Sukhasana",
    category: "Sitting",
    difficulty: "beginner",
    description: "A simple crossed-leg seat for breath and closing.",
    instructions: "Sit tall on a cushion. Change the cross of the legs as needed.",
    breathing: "Easy natural breath.",
    caution: "Sit in a chair if the floor is not comfortable.",
  },
];

async function seed() {
  const existing = await queryOne("SELECT id FROM users WHERE email = ?", [
    "admin@yogastudio.local",
  ]);
  if (existing) {
    console.log("Seed already applied");
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
    for (const pose of POSES) {
      await tx.query(
        `INSERT INTO yoga_poses
          (slug, name, sanskrit_name, category, difficulty, description, instructions, breathing_guidance, caution_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    }

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
