#!/usr/bin/env node
/**
 * Build script for the siteblaze CLI package.
 *
 * Steps:
 *  1. Bundle CLI TypeScript → dist/index.js  (esbuild)
 *  2. Copy built web app    → web/            (from apps/web/dist)
 *
 * Run after: nx build @org/web
 */

import * as esbuild from 'esbuild';
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webSrc  = join(__dirname, '../web/dist');
const webDest = join(__dirname, 'web');

// ── 1. Bundle CLI ─────────────────────────────────────────────────────────────

await esbuild.build({
  entryPoints: [join(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: join(__dirname, 'dist/index.js'),
  // Resolve @org/* packages to their TypeScript source via the @org/source condition
  conditions: ['@org/source'],
  // Keep these as runtime dependencies — they're in package.json
  external: [
    'express',
    'commander',
    'concurrently',
    'open',
    'adm-zip',
  ],
  logLevel: 'info',
});

// ── 2. Copy web app ───────────────────────────────────────────────────────────

if (!existsSync(webSrc)) {
  console.error(`\nWeb app build not found at ${webSrc}`);
  console.error('Run: npm exec nx build @org/web\n');
  process.exit(1);
}

if (existsSync(webDest)) rmSync(webDest, { recursive: true });
mkdirSync(webDest, { recursive: true });
cpSync(webSrc, webDest, { recursive: true });

// ── 3. Copy ui-elements source to templates/ ─────────────────────────────────

const templateSrc  = join(__dirname, '../../libs/ui-elements/src/lib');
const templateDest = join(__dirname, 'templates');

const TEMPLATE_FILES = [
  'theme.ts',
  'Navbar.tsx',
  'Hero.tsx',
  'Features.tsx',
  'CTASection.tsx',
  'Testimonials.tsx',
  'Pricing.tsx',
  'FAQ.tsx',
  'Stats.tsx',
  'Team.tsx',
  'Newsletter.tsx',
  'LogoCloud.tsx',
  'Skills.tsx',
  'Timeline.tsx',
  'PortfolioGrid.tsx',
  'ContactForm.tsx',
  'Gallery.tsx',
  'ProductGrid.tsx',
  'TrustBadges.tsx',
  'Countdown.tsx',
  'Schedule.tsx',
  'CaseStudy.tsx',
  'VideoEmbed.tsx',
];

const SHADCN_SECTION_FILES = [
  'Hero.tsx',
  'CTASection.tsx',
  'Navbar.tsx',
  'Newsletter.tsx',
  'ContactForm.tsx',
  'Features.tsx',
  'Pricing.tsx',
  'Testimonials.tsx',
  'Skills.tsx',
  'PortfolioGrid.tsx',
  'ProductGrid.tsx',
  'FAQ.tsx',
];

if (existsSync(templateDest)) rmSync(templateDest, { recursive: true });
mkdirSync(templateDest, { recursive: true });
mkdirSync(join(templateDest, 'shadcn'), { recursive: true });

for (const file of TEMPLATE_FILES) {
  const src = join(templateSrc, file);
  if (!existsSync(src)) {
    console.error(`\nTemplate file not found: ${src}\n`);
    process.exit(1);
  }
  cpSync(src, join(templateDest, file));
}

for (const file of SHADCN_SECTION_FILES) {
  const src = join(templateSrc, 'shadcn', file);
  if (!existsSync(src)) {
    console.error(`\nShadcn template file not found: ${src}\n`);
    process.exit(1);
  }
  cpSync(src, join(templateDest, 'shadcn', file));
}

// ── 4. Remove spec/test files from dist (tsc compilation artefacts) ──────────

const distDir = join(__dirname, 'dist');
if (existsSync(distDir)) {
  for (const file of readdirSync(distDir)) {
    if (file.includes('.spec.') || file.includes('.test.')) {
      unlinkSync(join(distDir, file));
    }
  }
}

// ── 5. Copy favicon into public/ ─────────────────────────────────────────────

const faviconSrc  = join(__dirname, '../../assets/favicon.ico');
const faviconDest = join(__dirname, 'public', 'favicon.ico');

if (existsSync(faviconSrc)) {
  mkdirSync(join(__dirname, 'public'), { recursive: true });
  cpSync(faviconSrc, faviconDest);
} else {
  console.warn('⚠  assets/favicon.ico not found — skipping favicon copy');
}

console.log(`\n✓  CLI bundled     → dist/index.js`);
console.log(`✓  Web app copied  → web/`);
console.log(`✓  Templates copied → templates/  (${TEMPLATE_FILES.length} plain + ${SHADCN_SECTION_FILES.length} shadcn)`);
console.log(`✓  Favicon copied  → public/favicon.ico\n`);
