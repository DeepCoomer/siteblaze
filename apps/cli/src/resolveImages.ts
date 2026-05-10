// ---------------------------------------------------------------------------
// Resolves imagePrompt / iconDescription fields in a generated config to real
// Unsplash photo URLs. Called at generate-time so the browser gets fast CDN
// URLs instead of waiting for on-demand image generation.
// ---------------------------------------------------------------------------

const UNSPLASH_RANDOM = 'https://api.unsplash.com/photos/random';

interface UnsplashPhoto {
  urls: { raw: string };
  alt_description: string | null;
}

async function fetchUnsplashUrl(
  query: string,
  accessKey: string,
  opts: { orientation: string; width: number; height: number }
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      query,
      orientation: opts.orientation,
      client_id: accessKey,
    });
    const res = await fetch(`${UNSPLASH_RANDOM}?${params}`);
    if (!res.ok) return null;
    const photo = (await res.json()) as UnsplashPhoto;
    return `${photo.urls.raw}&w=${opts.width}&h=${opts.height}&fit=crop&auto=format&q=80`;
  } catch {
    return null;
  }
}

// Minimal structural types — avoids rootDir violations from static imports.
type FeatureItem = {
  iconDescription?: string;
  iconUrl?: string;
  [key: string]: unknown;
};

type Section = {
  type: string;
  content: {
    imagePrompt?: string;
    imageUrl?: string;
    items?: FeatureItem[];
    [key: string]: unknown;
  };
};

export type RawConfig = { sections: Section[]; [key: string]: unknown };

export interface ResolveOptions {
  accessKey: string;
  onProgress: (current: string, resolved: number, total: number) => void;
}

/** Returns a deep-cloned config with imageUrl / iconUrl fields populated. */
export async function resolveImages(
  config: RawConfig,
  opts: ResolveOptions
): Promise<RawConfig> {
  const result = JSON.parse(JSON.stringify(config)) as RawConfig;

  // Count total images to resolve
  let total = 0;
  for (const s of result.sections) {
    if (s.type === 'HERO' && s.content.imagePrompt && !s.content.imageUrl) total++;
    if (s.type === 'FEATURES' && Array.isArray(s.content.items)) {
      for (const item of s.content.items) {
        if (item.iconDescription && !item.iconUrl) total++;
      }
    }
  }

  if (total === 0) return result;

  let resolved = 0;

  for (const section of result.sections) {
    if (section.type === 'HERO' && section.content.imagePrompt && !section.content.imageUrl) {
      const label = section.content.imagePrompt.slice(0, 55) + '…';
      opts.onProgress(label, resolved, total);
      const url = await fetchUnsplashUrl(section.content.imagePrompt, opts.accessKey, {
        orientation: 'landscape',
        width: 1200,
        height: 800,
      });
      if (url) section.content.imageUrl = url;
      resolved++;
      opts.onProgress(label, resolved, total);
    }

    if (section.type === 'FEATURES' && Array.isArray(section.content.items)) {
      for (const item of section.content.items) {
        if (item.iconDescription && !item.iconUrl) {
          const label = (item.iconDescription as string).slice(0, 55) + '…';
          opts.onProgress(label, resolved, total);
          const url = await fetchUnsplashUrl(item.iconDescription as string, opts.accessKey, {
            orientation: 'squarish',
            width: 400,
            height: 400,
          });
          if (url) item.iconUrl = url;
          resolved++;
          opts.onProgress(label, resolved, total);
        }
      }
    }
  }

  return result;
}
