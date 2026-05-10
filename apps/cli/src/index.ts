#!/usr/bin/env node
import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import concurrently from 'concurrently';
import { findWorkspaceRoot, runPreview } from './preview.js';
import { eject } from './eject.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = findWorkspaceRoot(__dirname, existsSync);

// ---------------------------------------------------------------------------
// Generic .env key reader — supports any KEY=VALUE line
// ---------------------------------------------------------------------------

function readKeyFromFile(filePath: string, keyName: string): string | undefined {
  try {
    for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      if (trimmed.slice(0, eq).trim() === keyName) {
        return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch { /* ignore unreadable file */ }
  return undefined;
}

function loadEnvKey(cwd: string, keyName: string): string | undefined {
  if (process.env[keyName]) return process.env[keyName];
  for (const name of ['.env.local', '.env']) {
    const val = readKeyFromFile(join(cwd, name), keyName);
    if (val) return val;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Spinner with a mutable label (updates live as each image resolves)
// ---------------------------------------------------------------------------

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function startSpinner(initialLabel: string) {
  let label = initialLabel;
  let frame = 0;
  const start = Date.now();

  const id = setInterval(() => {
    const secs = ((Date.now() - start) / 1000).toFixed(1);
    const line = `\r${SPINNER_FRAMES[frame % SPINNER_FRAMES.length]}  ${label}  ${secs}s `;
    process.stdout.write(line.padEnd(80));   // pad to overwrite any leftover chars
    frame++;
  }, 100);

  return {
    setLabel(l: string) { label = l; },
    stop(finalLine: string) {
      clearInterval(id);
      const secs = ((Date.now() - start) / 1000).toFixed(1);
      process.stdout.write(`\r\x1b[2K${finalLine} \x1b[2m(${secs}s)\x1b[0m\n`);
    },
  };
}

// ---------------------------------------------------------------------------
// Generated config summary
// ---------------------------------------------------------------------------

type SummaryConfig = {
  metadata: {
    siteName: string;
    themeMode?: string;
    fontFamily?: string;
    colors: { primary: string; secondary: string };
  };
  sections: Array<{ type: string; variant?: string }>;
};

function printSummary(config: SummaryConfig) {
  const { siteName, themeMode = 'light', fontFamily = 'sans', colors } = config.metadata;
  const sections = config.sections;

  console.log('\n\x1b[1m  What was generated\x1b[0m');
  console.log(`  Site      \x1b[36m${siteName}\x1b[0m`);
  console.log(`  Theme     \x1b[33m${themeMode}\x1b[0m  ·  \x1b[33m${fontFamily}\x1b[0m`);
  console.log(`  Colors    \x1b[35m${colors.primary}\x1b[0m  +  \x1b[35m${colors.secondary}\x1b[0m`);
  console.log(`  Sections  (${sections.length})`);
  for (const s of sections) {
    const variant = s.variant ? `\x1b[2m[${s.variant}]\x1b[0m` : '';
    console.log(`    \x1b[32m✓\x1b[0m  ${s.type.padEnd(14)} ${variant}`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('landing-engine')
  .description('Schema-driven landing page engine')
  .version('0.0.1');

// ── preview ──────────────────────────────────────────────────────────────────

program
  .command('preview')
  .description('Start a local preview — edits to config.json appear after a page refresh')
  .action(() =>
    runPreview({
      cwd: () => process.cwd(),
      fileExists: existsSync,
      writeFile: writeFileSync,
      run: concurrently,
      workspaceRoot,
    })
  );

// ── generate ─────────────────────────────────────────────────────────────────

program
  .command('generate <prompt>')
  .description('Generate a landing page config from a text description using AI')
  .option('-m, --model <model>', 'OpenRouter model ID', 'nvidia/nemotron-3-super-120b-a12b:free')
  .action(async (prompt: string, opts: { model: string }) => {
    const cwd = process.cwd();

    // 1. Load required OpenRouter key
    const apiKey = loadEnvKey(cwd, 'OPENROUTER_API_KEY');
    if (!apiKey) {
      console.error('\nError: OPENROUTER_API_KEY not found.');
      console.error('Add it to a .env or .env.local file:\n');
      console.error('  OPENROUTER_API_KEY=sk-or-...\n');
      process.exit(1);
    }

    console.log(`\n\x1b[1mGenerating landing page\x1b[0m  "${prompt}"`);
    console.log(`\x1b[2mModel: ${opts.model}\x1b[0m\n`);

    // 2. Call AI service.
    // Variable-path dynamic import prevents TypeScript from statically following
    // the module (which would violate rootDir). At runtime tsx resolves .js → .ts.
    type GenerateFn = (
      prompt: string,
      opts: { apiKey: string; model?: string }
    ) => Promise<unknown>;
    const aiPath = join(workspaceRoot, 'libs', 'engine-core', 'src', 'lib', 'ai.js');
    const { generateLandingPage } = (await import(aiPath)) as { generateLandingPage: GenerateFn };

    const aiSpinner = startSpinner('Calling AI');
    let config: unknown;
    try {
      config = await generateLandingPage(prompt, { apiKey, model: opts.model });
      aiSpinner.stop('\x1b[32m✓\x1b[0m  AI responded');
    } catch (err) {
      aiSpinner.stop('\x1b[31m✗\x1b[0m  Generation failed');
      console.error(`\n${String(err)}\n`);
      process.exit(1);
    }

    printSummary(config as SummaryConfig);

    // 3. Write config.json
    const configPath = join(cwd, 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`\x1b[32m✓\x1b[0m  config.json written  \x1b[2m${configPath}\x1b[0m`);
    console.log('\nLaunching preview…\n');

    // 4. Start preview (config.json already exists, skip write)
    runPreview({
      cwd: () => cwd,
      fileExists: () => true,
      writeFile: () => undefined,
      run: concurrently,
      workspaceRoot,
    });
  });

// ── eject ─────────────────────────────────────────────────────────────────

program
  .command('eject')
  .description('Export a standalone landing-page.tsx from the current config.json')
  .action(() => eject(process.cwd()));

program.parse(process.argv);
