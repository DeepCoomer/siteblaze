#!/usr/bin/env node
/**
 * Build script for the landing-engine CLI package.
 *
 * Steps:
 *  1. Bundle CLI TypeScript → dist/index.js  (esbuild)
 *  2. Copy built web app    → web/            (from apps/web/dist)
 *
 * Run after: nx build @org/web
 */

import * as esbuild from 'esbuild';
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
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
    // React is only used in the web app (pre-built); not needed in the CLI bundle
    'react',
    'react-dom',
    'react/jsx-runtime',
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
];

if (existsSync(templateDest)) rmSync(templateDest, { recursive: true });
mkdirSync(templateDest, { recursive: true });

for (const file of TEMPLATE_FILES) {
  const src = join(templateSrc, file);
  if (!existsSync(src)) {
    console.error(`\nTemplate file not found: ${src}\n`);
    process.exit(1);
  }
  cpSync(src, join(templateDest, file));
}

console.log(`\n✓  CLI bundled     → dist/index.js`);
console.log(`✓  Web app copied  → web/`);
console.log(`✓  Templates copied → templates/  (${TEMPLATE_FILES.length} files)\n`);
