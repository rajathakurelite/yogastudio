const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const configs = require("../configs");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function saveTextAsset(subdir, filename, contents, contentType = "image/svg+xml") {
  const folder = path.join(configs.media.dir, subdir);
  ensureDir(folder);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const full = path.join(folder, safeName);
  fs.writeFileSync(full, contents, "utf8");
  return {
    storagePath: full,
    storageUrl: `${configs.media.publicBase}/${subdir}/${safeName}`,
    contentType,
  };
}

function saveBinaryAsset(subdir, filename, buffer, contentType) {
  const folder = path.join(configs.media.dir, subdir);
  ensureDir(folder);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const full = path.join(folder, safeName);
  fs.writeFileSync(full, buffer);
  return {
    storagePath: full,
    storageUrl: `${configs.media.publicBase}/${subdir}/${safeName}`,
    contentType,
  };
}

function newAssetFilename(ext) {
  return `${Date.now()}-${uuid()}.${ext}`;
}

function sanitizeSvg(svg) {
  if (typeof svg !== "string") throw new Error("Expected SVG text");
  const trimmed = svg.trim();
  const start = trimmed.indexOf("<svg");
  const end = trimmed.lastIndexOf("</svg>");
  if (start === -1 || end === -1) throw new Error("Response did not contain SVG markup");
  const markup = trimmed.slice(start, end + 6);
  return markup
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

module.exports = {
  ensureDir,
  saveTextAsset,
  saveBinaryAsset,
  newAssetFilename,
  sanitizeSvg,
};
