import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt';

export interface ImageResult {
  heroImageUrl: string | null;
}

function buildImagePrompt(rawPrompt: string): string {
  return [
    rawPrompt,
    'hero illustration',
    'modern minimal design',
    'professional',
    'no text',
    'no UI elements',
  ].join(', ');
}

async function downloadImage(prompt: string, destPath: string): Promise<boolean> {
  const encoded = encodeURIComponent(prompt);
  const url = `${POLLINATIONS_URL}/${encoded}?width=1200&height=630&nologo=true`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fires image generation immediately from the raw CLI prompt, downloading to
 * a temp file so it can run in parallel before the project directory is known.
 *
 * Returns the temp file path on success, null on any failure.
 * Always resolves — never throws.
 */
export async function generateHeroImage(rawPrompt: string): Promise<string | null> {
  const tmpPath = join(tmpdir(), `snapsite-hero-${Date.now()}.jpg`);
  const ok = await downloadImage(buildImagePrompt(rawPrompt), tmpPath);
  return ok ? tmpPath : null;
}
