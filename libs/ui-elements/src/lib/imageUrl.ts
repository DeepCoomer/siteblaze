export type ImageSize = 'hero' | 'icon';

const DIMENSIONS: Record<ImageSize, { width: number; height: number }> = {
  hero: { width: 1200, height: 800 },
  icon: { width: 256,  height: 256  },
};

/**
 * Converts a natural-language prompt to a Pollinations.ai image URL.
 * Returns null when no prompt is provided — callers render a gradient fallback.
 */
export function imageUrl(prompt: string | undefined, size: ImageSize = 'hero'): string | null {
  if (!prompt?.trim()) return null;
  const { width, height } = DIMENSIONS[size];
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
}
