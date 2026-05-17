/**
 * Run once after dropping source logos into assets/:
 *   assets/logo-dark.png   — mark on #0F0F0F background (primary)
 *   assets/logo-white.png  — mark on #FFFFFF background
 *
 * Usage:
 *   node assets/resize.mjs
 *
 * Requires: npm install --save-dev sharp png-to-ico
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = __dirname;

const dark  = join(dir, 'logo-dark.png');
const white = join(dir, 'logo-white.png');

if (!existsSync(dark)) {
  console.error('Missing assets/logo-dark.png — drop the source file in first.');
  process.exit(1);
}

console.log('Resizing from logo-dark.png…');

// Peerlist / npm README / GitHub
await sharp(dark).resize(500, 500).toFile(join(dir, 'logo-500.png'));
console.log('✓  logo-500.png');

// Favicon sizes
await sharp(dark)
  .resize(32, 32, { fit: 'contain', background: { r: 15, g: 15, b: 15, alpha: 1 } })
  .toFile(join(dir, 'favicon-32.png'));
console.log('✓  favicon-32.png');

await sharp(dark)
  .resize(16, 16, { fit: 'contain', background: { r: 15, g: 15, b: 15, alpha: 1 } })
  .toFile(join(dir, 'favicon-16.png'));
console.log('✓  favicon-16.png');

// Apple touch icon (for siteblaze.dev later)
await sharp(dark).resize(180, 180).toFile(join(dir, 'apple-touch-icon.png'));
console.log('✓  apple-touch-icon.png');

// .ico bundle (16 + 32)
const ico = await pngToIco([join(dir, 'favicon-16.png'), join(dir, 'favicon-32.png')]);
writeFileSync(join(dir, 'favicon.ico'), ico);
console.log('✓  favicon.ico');

// White version outputs (if provided)
if (existsSync(white)) {
  await sharp(white).resize(500, 500).toFile(join(dir, 'logo-white-500.png'));
  console.log('✓  logo-white-500.png');
} else {
  console.log('ℹ  logo-white.png not found — skipping white variants');
}

console.log('\nDone. All outputs written to assets/');
