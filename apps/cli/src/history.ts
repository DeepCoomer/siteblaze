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

export function saveToHistory(config: unknown, prompt: string): void {
  try {
    mkdirSync(HISTORY_DIR, { recursive: true });

    const siteName = (config as { metadata?: { siteName?: string } })?.metadata?.siteName ?? 'site';
    const id = `${Date.now()}-${slugify(siteName)}`;

    writeFileSync(
      join(HISTORY_DIR, `${id}.json`),
      JSON.stringify({ id, prompt, siteName, savedAt: new Date().toISOString(), config }, null, 2)
    );

    // Prune oldest entries beyond MAX_ENTRIES
    const files = readdirSync(HISTORY_DIR).filter(f => f.endsWith('.json')).sort();
    if (files.length > MAX_ENTRIES) {
      files.slice(0, files.length - MAX_ENTRIES).forEach(f => {
        try { rmSync(join(HISTORY_DIR, f)); } catch { /* ignore */ }
      });
    }
  } catch { /* history is best-effort, never crash generation */ }
}

export function listHistory(): HistoryEntry[] {
  try {
    if (!existsSync(HISTORY_DIR)) return [];
    return readdirSync(HISTORY_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse() // newest first
      .flatMap(f => {
        try {
          const raw = JSON.parse(readFileSync(join(HISTORY_DIR, f), 'utf-8')) as {
            id: string; prompt: string; siteName: string; savedAt: string;
          };
          return [{ id: raw.id, prompt: raw.prompt, siteName: raw.siteName, savedAt: raw.savedAt, path: join(HISTORY_DIR, f) }];
        } catch { return []; }
      });
  } catch { return []; }
}

export function loadHistoryConfig(filePath: string): unknown {
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as { config: unknown };
  return raw.config;
}
