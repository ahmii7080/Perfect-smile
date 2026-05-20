// scripts/generate-og-image.mjs
//
// Generate the social-share preview image used by WhatsApp, Facebook,
// Twitter, LinkedIn etc. when someone shares a link to the site.
//
// Output: src/assets/images/og-default.jpg (1200×630, ~80 KB)
//
// Usage:
//   npm install --save-dev sharp   # one time
//   npm run generate-og            # whenever brand info changes
//
// The image is composed in SVG, then rasterised via sharp. Editing copy is
// just a string edit below — no design tool required.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('✗ sharp not installed. Run: npm install --save-dev sharp');
  process.exit(1);
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUT_DIR   = join(__dirname, '..', 'src', 'assets', 'images');
const OUT_FILE  = join(OUT_DIR, 'og-default.jpg');

// Editable copy — keep aligned with clinic-info.ts and SeoService description.
const CLINIC_NAME   = 'The Perfect Smile';
const CLINIC_SUB    = 'Dental & Implant Centre · Faisalabad';
const TAGLINE       = 'Crafting perfect smiles with artistry';
const DOCTOR_NAME   = 'Dr. Muhammad Faizan Sheikh';
const DOCTOR_QUAL   = 'BDS · Dip. Crown & Bridge · Cert. Orthodontics & Implantology';
const PHONE_DISPLAY = '+92 324 7734135';

/** Escape `& < >` for safe interpolation into the SVG XML below. */
const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const WIDTH  = 1200;
const HEIGHT = 630;

// SVG canvas. Brand-coloured gradient + soft decorative circles + bold typography.
// `text-anchor` keeps strings left-aligned regardless of font width quirks.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0EA5E9"/>
      <stop offset="55%"  stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0C4A6E"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="1080" cy="110"  r="190" fill="white" opacity="0.07"/>
  <circle cx="90"   cy="520"  r="220" fill="white" opacity="0.06"/>
  <circle cx="1140" cy="540"  r="80"  fill="#FAC775" opacity="0.18"/>

  <!-- Stylised tooth icon (top-right corner) -->
  <g transform="translate(950, 50) scale(2.6)" fill="white" opacity="0.18">
    <path d="M16 0c4 0 7 2 9 5 1 2 1 5 0 8-2 4-2 8-2 12 0 4-1 7-3 7-2 0-2-3-3-7-1-3-3-3-4 0-1 4-1 7-3 7-2 0-3-3-3-7 0-4 0-8-2-12-1-3-1-6 0-8 2-3 5-5 9-5z"
          stroke="white" stroke-width="0.5"/>
  </g>

  <!-- Title (serif wordmark) -->
  <text x="80" y="200"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="80" font-weight="700"
        fill="#ffffff">${xml(CLINIC_NAME)}</text>

  <!-- Sub-line (sans) -->
  <text x="80" y="258"
        font-family="-apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="30" font-weight="500"
        fill="rgba(255,255,255,0.88)">${xml(CLINIC_SUB)}</text>

  <!-- Tagline -->
  <text x="80" y="360"
        font-family="Georgia, serif"
        font-style="italic"
        font-size="36"
        fill="#FAC775">${xml(TAGLINE)}</text>

  <!-- Divider -->
  <rect x="80" y="395" width="80" height="3" fill="rgba(255,255,255,0.4)"/>

  <!-- Doctor block -->
  <text x="80" y="470"
        font-family="-apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="36" font-weight="700"
        fill="#ffffff">${xml(DOCTOR_NAME)}</text>
  <text x="80" y="510"
        font-family="-apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="22" font-weight="500"
        fill="rgba(255,255,255,0.78)">${xml(DOCTOR_QUAL)}</text>

  <!-- Phone badge (bottom-right) -->
  <g transform="translate(820, 540)">
    <rect width="320" height="56" rx="28"
          fill="rgba(255,255,255,0.18)"
          stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
    <text x="30" y="36"
          font-family="-apple-system, 'Segoe UI', Roboto, sans-serif"
          font-size="22" font-weight="600"
          fill="#ffffff">📞  ${xml(PHONE_DISPLAY)}</text>
  </g>
</svg>
`;

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

await sharp(Buffer.from(svg))
  .jpeg({ quality: 88, progressive: true, chromaSubsampling: '4:4:4' })
  .toFile(OUT_FILE);

console.log(`✓ og-default.jpg generated → ${OUT_FILE}`);
console.log('  Used by WhatsApp / Facebook / Twitter link previews.');
console.log('  Verify after deploy with: https://developers.facebook.com/tools/debug/');
