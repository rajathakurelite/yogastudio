const path = require("path");
const { query, queryOne } = require("./pool");
const configs = require("../configs");
const { ensureDir, saveTextAsset } = require("../utils/storage");
const { poseSvg, thumbnailSvg } = require("../utils/defaultIllustrations");

/**
 * Ensure every pose has a resolvable image_url SVG, and every published
 * class without a ready THUMBNAIL gets a deterministic class thumbnail.
 * Idempotent: skips poses that already have image_url; skips classes that
 * already have a ready THUMBNAIL asset.
 */
async function seedMedia() {
  ensureDir(configs.media.dir);

  const poses = await query(
    "SELECT id, slug, name, sanskrit_name, category, image_url FROM yoga_poses WHERE is_active = 1"
  );
  let posesUpdated = 0;
  for (const pose of poses) {
    if (pose.image_url) continue;
    const svg = poseSvg({
      name: pose.name,
      sanskrit: pose.sanskrit_name,
      category: pose.category,
    });
    const saved = saveTextAsset("poses", `${pose.slug}.svg`, svg);
    await query("UPDATE yoga_poses SET image_url = ? WHERE id = ?", [
      saved.storageUrl,
      pose.id,
    ]);
    posesUpdated += 1;
  }

  const classes = await query(
    `SELECT c.id, c.title, c.duration_minutes, c.level, s.name AS style_name
     FROM yoga_classes c
     LEFT JOIN yoga_styles s ON s.id = c.style_id
     WHERE c.status IN ('published', 'approved', 'draft', 'in_review', 'ready')`
  );
  let thumbnailsCreated = 0;
  for (const klass of classes) {
    const existing = await queryOne(
      `SELECT id FROM class_media_assets
       WHERE class_id = ? AND asset_type = 'THUMBNAIL' AND status = 'ready'
       LIMIT 1`,
      [klass.id]
    );
    if (existing) continue;

    const svg = thumbnailSvg({
      title: klass.title,
      durationMinutes: klass.duration_minutes,
      level: klass.level,
      styleName: klass.style_name,
    });
    const saved = saveTextAsset(
      `class-${klass.id}`,
      `thumbnail-${klass.id}.svg`,
      svg
    );
    await query(
      `INSERT INTO class_media_assets
        (class_id, sequence_item_id, asset_type, provider, storage_url, status, metadata_json, created_by)
       VALUES (?, NULL, 'THUMBNAIL', 'seed-default', ?, 'ready', ?, NULL)`,
      [
        klass.id,
        saved.storageUrl,
        JSON.stringify({ illustrationKind: "thumbnail", generator: "default-svg" }),
      ]
    );
    thumbnailsCreated += 1;
  }

  console.log(
    `Media seed: ${posesUpdated} pose images, ${thumbnailsCreated} class thumbnails (base ${configs.media.publicBase})`
  );
  return { posesUpdated, thumbnailsCreated };
}

if (require.main === module) {
  seedMedia()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedMedia };
