// scripts/optimize-images.mjs
//
// Convert source PNG/JPG images into responsive WebP + AVIF sets for the
// Angular `NgOptimizedImage` directive.
//
// Usage:
//   1. Drop original images into  src/assets/images/source/
//   2. npm install --save-dev sharp
//   3. node scripts/optimize-images.mjs
//   4. Reference the optimized images in templates with `<img ngSrc="...">`
//      (the default Angular loader serves them as static assets).
//
// Output naming: each `hero.jpg` becomes
//   src/assets/images/optimized/hero-480w.webp,  hero-480w.avif,
//                                hero-768w.webp,  hero-768w.avif,
//                                hero-1280w.webp, hero-1280w.avif,
//                                hero-1920w.webp, hero-1920w.avif

import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('✗ sharp not installed. Run: npm install --save-dev sharp');
  process.exit(1);
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SOURCE_DIR = join(__dirname, '..', 'src', 'assets', 'images', 'source');
const DEST_DIR   = join(__dirname, '..', 'src', 'assets', 'images', 'optimized');

// Responsive widths matching common breakpoints (mobile, tablet, desktop, retina).
const SIZES = [480, 768, 1280, 1920];

if (!existsSync(SOURCE_DIR)) {
  console.error(`✗ source directory missing: ${SOURCE_DIR}`);
  console.error('  create it and drop original PNG/JPG files inside, then re-run.');
  process.exit(1);
}

mkdirSync(DEST_DIR, { recursive: true });

const files = readdirSync(SOURCE_DIR).filter(f => /\.(png|jpe?g)$/i.test(f));
if (files.length === 0) {
  console.warn(`⚠ no PNG/JPG files in ${SOURCE_DIR}`);
  process.exit(0);
}

for (const file of files) {
  const stem    = basename(file, extname(file));
  const srcPath = join(SOURCE_DIR, file);
  console.log(`→ ${file}`);

  for (const w of SIZES) {
    const resized = sharp(srcPath).resize({ width: w, withoutEnlargement: true });

    await resized.clone().webp({ quality: 80 }).toFile(join(DEST_DIR, `${stem}-${w}w.webp`));
    await resized.clone().avif({ quality: 70 }).toFile(join(DEST_DIR, `${stem}-${w}w.avif`));
  }
}

console.log(`\n✓ Optimized ${files.length} image(s) into ${SIZES.length * 2} variants each.`);
console.log(`  Output: ${DEST_DIR}`);
