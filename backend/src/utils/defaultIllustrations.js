/**
 * Deterministic SVG illustrations for yoga poses and class thumbnails.
 * Used when AI media generation is unavailable or assets were never created.
 */

const PALETTE = {
  bg: "#F7F3EC",
  sage: "#5B6B52",
  sageDeep: "#3E4A38",
  sand: "#D4C4A8",
  clay: "#C4A484",
  cream: "#FFFCF7",
  leaf: "#7A8F6E",
};

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Simple stick-figure path sets keyed by category. */
const FIGURES = {
  Standing: `
    <circle cx="400" cy="160" r="36" />
    <path d="M400 196 v140" />
    <path d="M400 240 C 300 250 250 300 220 360" />
    <path d="M400 240 C 500 250 550 300 580 360" />
    <path d="M400 336 C 340 420 320 500 310 560" />
    <path d="M400 336 C 460 420 480 500 490 560" />
  `,
  Balance: `
    <circle cx="400" cy="150" r="34" />
    <path d="M400 184 v150" />
    <path d="M400 230 C 280 210 220 170 180 140" />
    <path d="M400 230 C 520 210 560 170 600 140" />
    <path d="M400 334 C 360 430 350 500 340 560" />
    <path d="M400 334 C 480 380 540 420 580 460" />
  `,
  Sitting: `
    <circle cx="400" cy="220" r="34" />
    <path d="M400 254 v90" />
    <path d="M400 290 C 300 300 240 340 200 390" />
    <path d="M400 290 C 500 300 560 340 600 390" />
    <path d="M400 344 C 320 420 260 460 220 480" />
    <path d="M400 344 C 480 420 540 460 580 480" />
    <path d="M220 480 C 300 500 500 500 580 480" />
  `,
  "Forward Fold": `
    <circle cx="400" cy="280" r="32" />
    <path d="M400 312 C 400 360 400 400 400 440" />
    <path d="M400 340 C 300 380 250 450 230 520" />
    <path d="M400 340 C 500 380 550 450 570 520" />
    <path d="M400 440 C 360 500 340 540 330 580" />
    <path d="M400 440 C 440 500 460 540 470 580" />
  `,
  Backbend: `
    <circle cx="400" cy="200" r="32" />
    <path d="M400 232 C 380 280 360 330 350 380" />
    <path d="M380 270 C 300 250 240 230 200 220" />
    <path d="M380 270 C 460 300 520 360 560 420" />
    <path d="M350 380 C 320 460 300 520 290 580" />
    <path d="M350 380 C 420 450 480 510 520 560" />
  `,
  Twist: `
    <circle cx="420" cy="170" r="34" />
    <path d="M400 204 v140" />
    <path d="M400 250 C 480 230 540 250 580 290" />
    <path d="M400 250 C 320 270 260 310 220 360" />
    <path d="M400 344 C 340 420 320 500 310 560" />
    <path d="M400 344 C 460 420 480 500 490 560" />
  `,
  Lying: `
    <circle cx="180" cy="360" r="30" />
    <path d="M210 360 H 520" />
    <path d="M280 360 C 280 300 300 260 320 240" />
    <path d="M280 360 C 280 420 300 460 320 480" />
    <path d="M520 360 C 560 340 600 320 640 300" />
    <path d="M520 360 C 560 380 600 400 640 420" />
  `,
  Relaxation: `
    <circle cx="400" cy="200" r="34" />
    <path d="M400 234 v100" />
    <path d="M400 280 C 300 290 240 320 200 360" />
    <path d="M400 280 C 500 290 560 320 600 360" />
    <path d="M400 334 C 340 400 300 450 280 500" />
    <path d="M400 334 C 460 400 500 450 520 500" />
    <ellipse cx="400" cy="520" rx="160" ry="28" opacity="0.35" />
  `,
  Breathing: `
    <circle cx="400" cy="220" r="36" />
    <path d="M400 256 v110" />
    <path d="M400 300 C 310 310 250 350 220 400" />
    <path d="M400 300 C 490 310 550 350 580 400" />
    <path d="M400 366 C 350 450 340 520 335 580" />
    <path d="M400 366 C 450 450 460 520 465 580" />
    <circle cx="400" cy="180" r="70" opacity="0.25" stroke-dasharray="8 10" />
    <circle cx="400" cy="180" r="100" opacity="0.15" stroke-dasharray="6 12" />
  `,
  Inversion: `
    <circle cx="400" cy="480" r="32" />
    <path d="M400 448 v-140" />
    <path d="M400 400 C 300 380 250 320 230 260" />
    <path d="M400 400 C 500 380 550 320 570 260" />
    <path d="M400 308 C 360 240 340 180 330 120" />
    <path d="M400 308 C 440 240 460 180 470 120" />
  `,
};

const DEFAULT_FIGURE = FIGURES.Standing;

function figureForCategory(category) {
  return FIGURES[category] || DEFAULT_FIGURE;
}

function poseSvg({ name, sanskrit, category }) {
  const label = escapeXml(name || "Pose");
  const sub = escapeXml(sanskrit || category || "");
  const figure = figureForCategory(category);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PALETTE.bg}"/>
      <stop offset="100%" stop-color="${PALETTE.sand}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="640" cy="140" r="90" fill="${PALETTE.leaf}" opacity="0.18"/>
  <circle cx="140" cy="660" r="120" fill="${PALETTE.clay}" opacity="0.16"/>
  <g fill="none" stroke="${PALETTE.sageDeep}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    ${figure}
  </g>
  <text x="400" y="700" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="${PALETTE.sageDeep}">${label}</text>
  <text x="400" y="740" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-style="italic" fill="${PALETTE.sage}">${sub}</text>
</svg>`;
}

function thumbnailSvg({ title, durationMinutes, level, styleName }) {
  const safeTitle = escapeXml(title || "Yoga Class");
  const meta = escapeXml(
    [durationMinutes ? `${durationMinutes} min` : null, level, styleName]
      .filter(Boolean)
      .join(" · ")
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="tb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PALETTE.sageDeep}"/>
      <stop offset="55%" stop-color="${PALETTE.sage}"/>
      <stop offset="100%" stop-color="${PALETTE.leaf}"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#tb)"/>
  <circle cx="1080" cy="120" r="180" fill="${PALETTE.cream}" opacity="0.08"/>
  <circle cx="160" cy="600" r="220" fill="${PALETTE.sand}" opacity="0.12"/>
  <g fill="none" stroke="${PALETTE.cream}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" transform="translate(720,40) scale(0.72)">
    ${FIGURES.Balance}
  </g>
  <text x="72" y="320" font-family="Georgia, serif" font-size="64" fill="${PALETTE.cream}">${safeTitle}</text>
  <text x="72" y="390" font-family="system-ui, sans-serif" font-size="28" fill="${PALETTE.sand}">${meta}</text>
</svg>`;
}

module.exports = {
  poseSvg,
  thumbnailSvg,
  PALETTE,
};
