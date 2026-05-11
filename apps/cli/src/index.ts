#!/usr/bin/env node
import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import concurrently from 'concurrently';
import { findWorkspaceRoot, runPreview, runEmbeddedPreview } from './preview.js';
import { eject } from './eject.js';
import { scaffoldProject } from './scaffold.js';
import { resolveApiKey, configureAuth } from './auth.js';
import { generateLandingPage } from '@org/engine-core';
import { isPublishedMode } from './server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Nullable — null when running as a published package outside the monorepo
let workspaceRoot: string | null = null;
try {
  workspaceRoot = findWorkspaceRoot(__dirname, existsSync);
} catch {
  // published / npx mode — no monorepo present
}

// ---------------------------------------------------------------------------
// .env key loader
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
  } catch { /* ignore */ }
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
// Spinner
// ---------------------------------------------------------------------------

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function startSpinner(initialLabel: string) {
  let label = initialLabel;
  let frame = 0;
  const start = Date.now();

  const id = setInterval(() => {
    const secs = ((Date.now() - start) / 1000).toFixed(1);
    process.stdout.write(`\r${SPINNER_FRAMES[frame % SPINNER_FRAMES.length]}  ${label}  ${secs}s `.padEnd(80));
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
// Summary printer
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
  console.log('\n\x1b[1m  What was generated\x1b[0m');
  console.log(`  Site      \x1b[36m${siteName}\x1b[0m`);
  console.log(`  Theme     \x1b[33m${themeMode}\x1b[0m  ·  \x1b[33m${fontFamily}\x1b[0m`);
  console.log(`  Colors    \x1b[35m${colors.primary}\x1b[0m  +  \x1b[35m${colors.secondary}\x1b[0m`);
  console.log(`  Sections  (${config.sections.length})`);
  for (const s of config.sections) {
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
  .description('Schema-driven landing page generator')
  .version('0.1.0');

// ── preview ──────────────────────────────────────────────────────────────────

program
  .command('preview')
  .description('Start a local preview server — edits to config.json appear on refresh')
  .action(() => {
    if (isPublishedMode() || !workspaceRoot) {
      runEmbeddedPreview(process.cwd());
    } else {
      runPreview({
        cwd: () => process.cwd(),
        fileExists: existsSync,
        writeFile: writeFileSync,
        run: concurrently,
        workspaceRoot,
      });
    }
  });

// ── generate ─────────────────────────────────────────────────────────────────

program
  .command('generate <prompt>')
  .description('Generate a complete React + Tailwind project from a text prompt using AI')
  .option('-m, --model <model>', 'OpenRouter model ID', 'nvidia/nemotron-3-super-120b-a12b:free')
  .option('-o, --output <path>', 'Directory to create the project in (default: current directory)')
  .action(async (prompt: string, opts: { model: string; output?: string }) => {
    const outputDir = opts.output ? resolve(opts.output) : process.cwd();

    const apiKey = await resolveApiKey(loadEnvKey(process.cwd(), 'OPENROUTER_API_KEY'));

    console.log(`\n\x1b[1mGenerating landing page\x1b[0m  "${prompt}"`);
    console.log(`\x1b[2mModel: ${opts.model}\x1b[0m\n`);

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

    const scaffoldSpinner = startSpinner('Scaffolding project');
    let projectDir: string;
    try {
      const { mkdirSync } = await import('fs');
      mkdirSync(outputDir, { recursive: true });
      projectDir = scaffoldProject(config as Parameters<typeof scaffoldProject>[0], outputDir, workspaceRoot);
      scaffoldSpinner.stop('\x1b[32m✓\x1b[0m  Project created');
    } catch (err) {
      scaffoldSpinner.stop('\x1b[31m✗\x1b[0m  Scaffold failed');
      console.error(`\n${String(err)}\n`);
      process.exit(1);
    }

    const folderName = projectDir.split('/').at(-1) ?? projectDir;
    console.log(`\n  \x1b[1mNext steps\x1b[0m`);
    console.log(`  \x1b[36mcd ${folderName}\x1b[0m`);
    console.log(`  \x1b[36mnpm install\x1b[0m`);
    console.log(`  \x1b[36mnpm run dev\x1b[0m`);
    console.log(`\n  Then edit \x1b[33msrc/LandingPage.tsx\x1b[0m to customise your page.\n`);
  });

// ── auth ──────────────────────────────────────────────────────────────────────

program
  .command('auth')
  .description('Save your OpenRouter API key for all future runs')
  .action(configureAuth);

// ── eject ─────────────────────────────────────────────────────────────────────

program
  .command('eject')
  .description('Export a standalone landing-page.tsx from the current config.json')
  .action(() => eject(process.cwd()));

program.parse(process.argv);
