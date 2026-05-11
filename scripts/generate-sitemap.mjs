// scripts/generate-sitemap.mjs
//
// Post-build sitemap generator. Walks the prerendered HTML output and emits
// a sitemap.xml at the site root.
//
// Run automatically after `ng build` via the `postbuild` npm script — so the
// sitemap is always in sync with whatever pages actually got prerendered
// (including dynamic blog/service slugs fetched from Supabase at build time).
//
// Run manually:  node scripts/generate-sitemap.mjs

import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Production origin — keep aligned with environment.prod.ts `siteUrl`.
const SITE_URL    = 'https://theperfectsmileclinic.com';
const BROWSER_DIR = join(__dirname, '..', 'dist', 'perfect-smile', 'browser');

if (!existsSync(BROWSER_DIR)) {
  console.error(`✗ sitemap: build output not found at ${BROWSER_DIR}`);
  console.error('  run `npm run build` first.');
  process.exit(1);
}

/** Yield every `index.html` under the build's browser directory. */
function* walkIndexHtml(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory())               yield* walkIndexHtml(fullPath);
    else if (entry.name === 'index.html')  yield fullPath;
  }
}

// Discover every prerendered route by inspecting the file tree.
const paths = [];
for (const file of walkIndexHtml(BROWSER_DIR)) {
  const rel = relative(BROWSER_DIR, file).replace(/\\/g, '/');

  // `blog/foo/index.html` → `/blog/foo`,  `index.html` → `/`
  let path = posix.dirname(rel);
  path = path === '.' ? '/' : `/${path}`;

  // Strip admin shell + login surfaces — they carry `noindex` already, but
  // they shouldn't be advertised in the sitemap either.
  if (path === '/adminauthlogin' || path === '/admin' || path.startsWith('/admin/')) continue;

  paths.push(path);
}
paths.sort();

// Priority / changefreq heuristics. Tweak as page importance evolves.
const PRIORITY_OVERRIDES = {
  '/':            '1.0',
  '/services':    '0.9',
  '/appointment': '0.9',
  '/about':       '0.8',
  '/contact':     '0.8',
  '/doctors':     '0.8',
  '/blog':        '0.7',
  '/gallery':     '0.7',
  '/team':        '0.7'
};

function priorityFor(path) {
  if (PRIORITY_OVERRIDES[path]) return PRIORITY_OVERRIDES[path];
  if (path.startsWith('/services/')) return '0.8';   // service detail pages
  if (path.startsWith('/blog/'))     return '0.6';   // blog articles
  return '0.5';
}

function changefreqFor(path) {
  if (path === '/')                      return 'weekly';
  if (path.startsWith('/blog'))          return 'monthly';
  if (path.startsWith('/services'))      return 'monthly';
  if (path === '/gallery' || path === '/team') return 'monthly';
  return 'yearly';
}

const today = new Date().toISOString().slice(0, 10);

const urlEntries = paths.map(path => {
  const loc = `${SITE_URL}${path === '/' ? '' : path}`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreqFor(path)}</changefreq>
    <priority>${priorityFor(path)}</priority>
  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const outPath = join(BROWSER_DIR, 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log(`✓ sitemap.xml written — ${paths.length} URLs → ${outPath}`);
