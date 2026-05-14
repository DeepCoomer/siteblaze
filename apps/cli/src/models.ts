import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { FREE_MODELS } from '@org/engine-core';

const CONFIG_DIR  = join(homedir(), '.config', 'snapsite');
const MODELS_FILE = join(CONFIG_DIR, 'models.json');

interface ModelsConfig {
  models: string[];
  updatedAt: string;
}

/**
 * Resolves the model list for racing in priority order:
 *   1. SNAPSITE_MODELS env var  (comma-separated)
 *   2. ~/.config/snapsite/models.json  (written by `list-models --refresh`)
 *   3. Hardcoded FREE_MODELS defaults
 */
export function resolveRaceModels(): string[] {
  const fromEnv = process.env['SNAPSITE_MODELS'];
  if (fromEnv?.trim()) {
    return fromEnv.split(',').map(m => m.trim()).filter(Boolean);
  }

  if (existsSync(MODELS_FILE)) {
    try {
      const saved = JSON.parse(readFileSync(MODELS_FILE, 'utf-8')) as ModelsConfig;
      if (Array.isArray(saved.models) && saved.models.length > 0) return saved.models;
    } catch { /* fall through */ }
  }

  return [...FREE_MODELS];
}

export function saveModels(models: string[]): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const config: ModelsConfig = { models, updatedAt: new Date().toISOString() };
  writeFileSync(MODELS_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function loadSavedModelsInfo(): { updatedAt: string } | null {
  try {
    const saved = JSON.parse(readFileSync(MODELS_FILE, 'utf-8')) as ModelsConfig;
    return { updatedAt: saved.updatedAt };
  } catch {
    return null;
  }
}

/**
 * Fetches all free text/chat models from OpenRouter and returns their IDs.
 * Filters out embedding, image, and audio models.
 */
export async function fetchFreeModels(apiKey: string): Promise<string[]> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://snapsite.dev',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`OpenRouter responded with ${res.status}`);

  const data = await res.json() as {
    data?: Array<{
      id: string;
      pricing?: { prompt: string; completion: string };
      architecture?: { modality?: string };
    }>;
  };

  return (data.data ?? [])
    .filter(m => {
      const isFree = m.id.endsWith(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0');
      const isText = !m.architecture?.modality || m.architecture.modality.includes('text');
      return isFree && isText;
    })
    .map(m => m.id);
}
