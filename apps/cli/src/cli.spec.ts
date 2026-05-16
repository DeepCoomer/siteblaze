import { describe, it, expect, beforeAll } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '../dist/index.js');

beforeAll(() => {
  if (!existsSync(CLI)) {
    throw new Error(`dist/index.js not found — run 'node build.mjs' in apps/cli before running CLI integration tests`);
  }
});

function run(args: string, env: Record<string, string> = {}): { stdout: string; stderr: string; status: number } {
  const result = spawnSync('node', [CLI, ...args.split(' ')], {
    encoding: 'utf-8',
    env: { ...process.env, NO_COLOR: '1', ...env },
    timeout: 10_000,
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 1,
  };
}

// ---------------------------------------------------------------------------
// --version
// ---------------------------------------------------------------------------

describe('siteblaze --version', () => {
  it('exits 0 and outputs a semver version string', () => {
    const { stdout, status } = run('--version');
    expect(status).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ---------------------------------------------------------------------------
// --help
// ---------------------------------------------------------------------------

describe('siteblaze --help', () => {
  let stdout = '';

  beforeAll(() => {
    ({ stdout } = run('--help'));
  });

  it('exits 0', () => {
    expect(run('--help').status).toBe(0);
  });

  it('shows the tagline', () => {
    expect(stdout).toContain('AI picks sections, not code');
  });

  it('lists all top-level commands', () => {
    expect(stdout).toContain('generate');
    expect(stdout).toContain('open');
    expect(stdout).toContain('auth');
    expect(stdout).toContain('list-models');
  });
});

// ---------------------------------------------------------------------------
// generate --help
// ---------------------------------------------------------------------------

describe('siteblaze generate --help', () => {
  let stdout = '';

  beforeAll(() => {
    ({ stdout } = run('generate --help'));
  });

  it('documents all major flags', () => {
    expect(stdout).toContain('--preview');
    expect(stdout).toContain('--framework');
    expect(stdout).toContain('--ui');
    expect(stdout).toContain('--theme');
    expect(stdout).toContain('--yes');
    expect(stdout).toContain('--no-image');
    expect(stdout).toContain('--verbose');
  });

  it('documents the --type flag with all site types', () => {
    expect(stdout).toContain('--type');
    expect(stdout).toContain('landing');
    expect(stdout).toContain('saas');
    expect(stdout).toContain('portfolio');
  });
});

// ---------------------------------------------------------------------------
// list-models
// ---------------------------------------------------------------------------

describe('siteblaze list-models', () => {
  it('exits 0 without an API key when reading defaults', () => {
    const { status } = run('list-models', { SITEBLAZE_MODELS: 'openai/gpt-4o-mini' });
    expect(status).toBe(0);
  });

  it('shows the model from SITEBLAZE_MODELS env', () => {
    const { stdout } = run('list-models', { SITEBLAZE_MODELS: 'openai/gpt-4o-mini' });
    expect(stdout).toContain('openai/gpt-4o-mini');
  });

  it('shows multiple models when comma-separated', () => {
    const { stdout } = run('list-models', { SITEBLAZE_MODELS: 'openai/gpt-4o-mini,google/gemma-2-9b-it:free' });
    expect(stdout).toContain('openai/gpt-4o-mini');
    expect(stdout).toContain('google/gemma-2-9b-it:free');
  });
});

// ---------------------------------------------------------------------------
// open — no history
// ---------------------------------------------------------------------------

describe('siteblaze open — no history', () => {
  it('prints a helpful message and exits 0 when no history exists', () => {
    const fakeHome = join(tmpdir(), `siteblaze-cli-test-${process.pid}`);
    mkdirSync(fakeHome, { recursive: true });
    try {
      const { stdout, status } = run('open', { HOME: fakeHome, USERPROFILE: fakeHome });
      expect(status).toBe(0);
      expect(stdout).toContain('No history found');
    } finally {
      rmSync(fakeHome, { recursive: true, force: true });
    }
  });
});
