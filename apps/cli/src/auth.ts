import * as clack from '@clack/prompts';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { fetchFreeModels, saveModels } from './models.js';

const CONFIG_DIR  = join(homedir(), '.config', 'siteblaze');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// ── Persistence ───────────────────────────────────────────────────────────────

export function loadSavedApiKey(): string | undefined {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return (JSON.parse(raw) as { openRouterApiKey?: string }).openRouterApiKey || undefined;
  } catch {
    return undefined;
  }
}

function loadSavedKey(): string | undefined {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return (JSON.parse(raw) as { openRouterApiKey?: string }).openRouterApiKey || undefined;
  } catch {
    return undefined;
  }
}

function saveKey(key: string): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  // 0o600 = owner read/write only — key never visible to other users
  writeFileSync(CONFIG_FILE, JSON.stringify({ openRouterApiKey: key }, null, 2), { mode: 0o600 });
}

// ── Key validation ────────────────────────────────────────────────────────────

async function validateApiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolves the OpenRouter API key in priority order:
 *   1. Environment variable / project .env  (already extracted by caller)
 *   2. ~/.config/siteblaze/config.json
 *   3. Interactive prompt — offers to save for future runs
 */
export async function resolveApiKey(fromEnv: string | undefined): Promise<string> {
  if (fromEnv) return fromEnv;

  const saved = loadSavedKey();
  if (saved) return saved;

  clack.log.info('OpenRouter API key required. Get a free key at https://openrouter.ai/keys');

  const key = await clack.password({ message: 'Paste your API key' });
  if (clack.isCancel(key) || !key) {
    clack.cancel('No key entered — aborting.');
    process.exit(1);
  }

  const save = await clack.confirm({
    message: 'Save to ~/.config/siteblaze/ for future runs?',
    initialValue: true,
  });
  if (clack.isCancel(save)) {
    process.exit(0);
  }
  if (save) {
    saveKey(key as string);
    clack.log.success('Key saved.');
    fetchFreeModels(key as string).then(models => saveModels(models)).catch(() => {});
  }

  return key as string;
}

/**
 * `siteblaze auth` — set or replace the saved API key.
 */
export async function configureAuth(): Promise<void> {
  const existing = loadSavedKey();

  if (existing) {
    const masked = existing.slice(0, 10) + '…';
    clack.log.info(`Saved key: ${masked}`);
    const replace = await clack.confirm({ message: 'Replace it?', initialValue: false });
    if (clack.isCancel(replace) || !replace) {
      clack.log.info('No changes made.');
      return;
    }
  } else {
    clack.log.info('Get a free key at https://openrouter.ai/keys');
  }

  const key = await clack.password({ message: 'Paste your API key' });
  if (clack.isCancel(key) || !key) {
    clack.log.warn('No key entered.');
    return;
  }

  const spin = clack.spinner();
  spin.start('Validating key');
  const valid = await validateApiKey(key as string);
  if (!valid) {
    spin.stop('Key rejected by OpenRouter — check the key and try again.');
    return;
  }
  saveKey(key as string);
  spin.message('Fetching latest model list…');
  try {
    const models = await fetchFreeModels(key as string);
    saveModels(models);
    spin.stop(`Key saved · ${models.length} free models cached`);
  } catch {
    spin.stop(`Key valid · saved to ${CONFIG_FILE}`);
  }
}
