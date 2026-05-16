import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HISTORY_DIR = join(homedir(), '.config', 'siteblaze', 'history');
const MAX_ENTRIES = 10;

export type HistoryEntry = {
  id: string;
  prompt: string;
  siteName: string;
  savedAt: string;
  path: string;
};

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

export function saveToHistory(config: unknown, prompt: string, dir = HISTORY_DIR): string | undefined {
  try {
    mkdirSync(dir, { recursive: true });

    const siteName = (config as { metadata?: { siteName?: string } })?.metadata?.siteName ?? 'site';
    const id = `${Date.now()}-${slugify(siteName)}`;
    const filePath = join(dir, `${id}.json`);

    writeFileSync(
      filePath,
      JSON.stringify({ id, prompt, siteName, savedAt: new Date().toISOString(), config }, null, 2)
    );

    // Prune oldest entries beyond MAX_ENTRIES
    const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
    if (files.length > MAX_ENTRIES) {
      files.slice(0, files.length - MAX_ENTRIES).forEach(f => {
        try { rmSync(join(dir, f)); } catch { /* ignore */ }
      });
    }

    return filePath;
  } catch { /* history is best-effort, never crash generation */ }
}

export function listHistory(dir = HISTORY_DIR): HistoryEntry[] {
  try {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse() // newest first
      .flatMap(f => {
        try {
          const raw = JSON.parse(readFileSync(join(dir, f), 'utf-8')) as {
            id: string; prompt: string; siteName: string; savedAt: string;
          };
          return [{ id: raw.id, prompt: raw.prompt, siteName: raw.siteName, savedAt: raw.savedAt, path: join(dir, f) }];
        } catch { return []; }
      });
  } catch { return []; }
}

export function loadHistoryConfig(filePath: string): unknown {
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as { config: unknown };
  return raw.config;
}
