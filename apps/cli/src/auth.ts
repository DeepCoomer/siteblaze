import { createInterface } from 'readline';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR  = join(homedir(), '.config', 'siteblaze');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// ── Persistence ───────────────────────────────────────────────────────────────

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

// ── Terminal helpers ──────────────────────────────────────────────────────────

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    // Suppress echoing so keystrokes don't appear in the terminal
    (rl as unknown as { _writeToOutput(s: string): void })._writeToOutput = (s: string) => {
      if (s === '\r\n' || s === '\n') process.stdout.write('\n');
    };
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptLine(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
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

  console.log('\n  \x1b[1mOpenRouter API key required\x1b[0m');
  console.log('  Get a free key at \x1b[36mhttps://openrouter.ai/keys\x1b[0m\n');

  const key = await promptHidden('  Paste your API key (input hidden): ');
  if (!key) {
    console.error('\n  No key entered — aborting.\n');
    process.exit(1);
  }

  const answer = await promptLine('  Save to ~/.config/siteblaze/ for future runs? [Y/n] ');
  if (answer.toLowerCase() !== 'n') {
    saveKey(key);
    console.log('  \x1b[32m✓\x1b[0m  Key saved.\n');
  } else {
    console.log();
  }

  return key;
}

/**
 * `siteblaze auth` — set or replace the saved API key.
 */
export async function configureAuth(): Promise<void> {
  const existing = loadSavedKey();

  if (existing) {
    const masked = existing.slice(0, 10) + '…';
    console.log(`\n  Saved key: \x1b[2m${masked}\x1b[0m`);
    const answer = await promptLine('  Replace it? [y/N] ');
    if (answer.toLowerCase() !== 'y') {
      console.log('  No changes made.\n');
      return;
    }
  } else {
    console.log('\n  \x1b[1mConfigure OpenRouter API key\x1b[0m');
    console.log('  Get a free key at \x1b[36mhttps://openrouter.ai/keys\x1b[0m\n');
  }

  const key = await promptHidden('  Paste your API key (input hidden): ');
  if (!key) {
    console.error('\n  No key entered.\n');
    return;
  }

  process.stdout.write('  Validating key…');
  const valid = await validateApiKey(key);
  if (!valid) {
    process.stdout.write('\r\x1b[2K');
    console.error('  \x1b[31m✗\x1b[0m  Key rejected by OpenRouter — check the key and try again.\n');
    return;
  }
  process.stdout.write('\r\x1b[2K');

  saveKey(key);
  console.log(`  \x1b[32m✓\x1b[0m  Key valid and saved to \x1b[2m${CONFIG_FILE}\x1b[0m\n`);
}
