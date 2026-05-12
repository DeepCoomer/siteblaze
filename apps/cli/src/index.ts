#!/usr/bin/env node
import { Command } from 'commander';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import concurrently from 'concurrently';
import { findWorkspaceRoot, runPreview, runEmbeddedPreview } from './preview.js';
import { eject } from './eject.js';
import { scaffoldProject, rewriteLandingPage, type Framework } from './scaffold.js';
import { resolveApiKey, configureAuth } from './auth.js';
import { generateHeroImage } from './images.js';
import { generateLandingPage, refinePrompt, FREE_MODELS, type SiteType, type ThemeOverride, inferSiteType, extractCategoryHint } from '@org/engine-core';
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
// Banner
// ---------------------------------------------------------------------------

function printBanner() {
  const lines = [
    '',
    `  \x1b[35m╭──────────────────────────────────────╮\x1b[0m`,
    `  \x1b[35m│\x1b[0m                                      \x1b[35m│\x1b[0m`,
    `  \x1b[35m│\x1b[0m   \x1b[1m\x1b[35m◆\x1b[0m  \x1b[1mlanding-engine\x1b[0m  \x1b[2mv0.1.0\x1b[0m          \x1b[35m│\x1b[0m`,
    `  \x1b[35m│\x1b[0m      \x1b[2mAI · React · Tailwind\x1b[0m           \x1b[35m│\x1b[0m`,
    `  \x1b[35m│\x1b[0m                                      \x1b[35m│\x1b[0m`,
    `  \x1b[35m╰──────────────────────────────────────╯\x1b[0m`,
    '',
  ];
  console.log(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// Site type confirmation
// ---------------------------------------------------------------------------

const SITE_TYPES: SiteType[] = ['landing', 'portfolio', 'agency', 'saas', 'blog', 'ecommerce', 'event'];

const SITE_TYPE_DESC: Record<SiteType, string> = {
  landing:   'generic marketing / product landing page',
  portfolio: 'personal portfolio with work showcase and skills',
  agency:    'creative or marketing agency with client logos and team',
  saas:      'software product with pricing, features, and stats',
  blog:      'content site with newsletter and article highlights',
  ecommerce: 'online store with product grid, trust badges, and shopping CTAs',
  event:     'conference, concert, or meetup with countdown and schedule',
};

async function confirmSiteType(detected: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));

  const knownDesc = SITE_TYPE_DESC[detected as SiteType];
  const desc = knownDesc ? `\x1b[2m— ${knownDesc}\x1b[0m` : '';
  console.log(`\n  Site type detected: \x1b[36m${detected}\x1b[0m  ${desc}`);
  const answer = await ask('  Correct? [Y/n]  ');
  const confirmed = answer.trim().toLowerCase() !== 'n';

  if (confirmed) {
    rl.close();
    console.log();
    return detected;
  }

  console.log('\n  Preset types:\n');
  SITE_TYPES.forEach((t, i) => {
    console.log(`  \x1b[36m${i + 1}\x1b[0m  ${t.padEnd(12)} \x1b[2m${SITE_TYPE_DESC[t]}\x1b[0m`);
  });
  console.log(`\n  Or type a custom category (e.g. "restaurant", "real estate", "gym")`);

  const pick = await ask('\n  Enter number or custom name:  ');
  rl.close();
  console.log();

  const trimmed = pick.trim();
  const idx = parseInt(trimmed, 10) - 1;
  if (!isNaN(idx) && idx >= 0 && idx < SITE_TYPES.length) return SITE_TYPES[idx];
  if (trimmed.length > 0) return trimmed.toLowerCase();
  return detected;
}

// ---------------------------------------------------------------------------
// Theme confirmation
// ---------------------------------------------------------------------------

async function confirmTheme(explicit?: string): Promise<ThemeOverride | undefined> {
  if (explicit === 'light' || explicit === 'dark' || explicit === 'midnight') return explicit;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));

  console.log(`  \x1b[2mTheme:\x1b[0m  \x1b[36m1\x1b[0m Light  \x1b[36m2\x1b[0m Dark  \x1b[36m3\x1b[0m Midnight`);
  const answer = await ask('  Choose [1/2/3] — default AI picks:  ');
  rl.close();
  console.log();

  const map: Record<string, ThemeOverride> = { '1': 'light', '2': 'dark', '3': 'midnight' };
  return map[answer.trim()];
}

// ---------------------------------------------------------------------------
// Framework confirmation
// ---------------------------------------------------------------------------

async function confirmFramework(explicit?: string): Promise<Framework> {
  if (explicit === 'nextjs' || explicit === 'vite') return explicit;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));

  console.log(`  \x1b[2mFramework:\x1b[0m  \x1b[36m1\x1b[0m Vite  \x1b[2m(SPA, fast dev server)\x1b[0m   \x1b[36m2\x1b[0m Next.js  \x1b[2m(SSR, file-based routing)\x1b[0m`);
  const answer = await ask('  Choose [1/2] — default Vite:  ');
  rl.close();
  console.log();
  return answer.trim() === '2' ? 'nextjs' : 'vite';
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('landing-engine')
  .description('Schema-driven landing page generator')
  .version('0.1.0')
  .hook('preAction', printBanner);

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
  .option('-m, --model <model>', 'Specific OpenRouter model ID (omit to race all free models)')
  .option('-o, --output <path>', 'Directory to create the project in (default: current directory)')
  .option('-t, --type <type>', 'Site type: landing | portfolio | agency | saas | blog (auto-detected if omitted)')
  .option('-f, --framework <fw>', 'Output framework: vite | nextjs (prompted if omitted)')
  .option('--theme <theme>', 'Theme mode: light | dark | midnight (prompted if omitted)')
  .action(async (prompt: string, opts: { model?: string; output?: string; type?: string; framework?: string; theme?: string }) => {
    const outputDir = opts.output ? resolve(opts.output) : process.cwd();

    const apiKey = await resolveApiKey(loadEnvKey(process.cwd(), 'OPENROUTER_API_KEY'));

    console.log(`\n\x1b[1mGenerating landing page\x1b[0m  "${prompt}"`);
    if (opts.model) {
      console.log(`\x1b[2mModel: ${opts.model}\x1b[0m\n`);
    } else {
      console.log(`\x1b[2mRacing ${FREE_MODELS.length} free models — first valid response wins\x1b[0m\n`);
    }

    // Resolve site category hint sent to the AI.
    // --type flag skips confirmation; otherwise extract a category hint
    // (may be a known type name or a free-form label like "restaurant")
    // and ask the user to confirm.
    const detectedCategory = opts.type ?? extractCategoryHint(prompt);
    const siteType = opts.type
      ? detectedCategory
      : await confirmSiteType(detectedCategory);

    const framework  = await confirmFramework(opts.framework);
    const themeMode  = await confirmTheme(opts.theme);

    // Refine terse prompts before generation — skipped for detailed prompts (>=12 words)
    let refinedPrompt = prompt;
    if (prompt.trim().split(/\s+/).length < 12) {
      const refineSpinner = startSpinner('Expanding prompt');
      refinedPrompt = await refinePrompt(prompt, apiKey);
      refineSpinner.stop(
        refinedPrompt !== prompt
          ? `\x1b[32m✓\x1b[0m  Prompt expanded`
          : `\x1b[2m~\x1b[0m  Prompt used as-is`
      );
    }

    const spinner = startSpinner(opts.model ? 'Calling AI' : `Racing ${FREE_MODELS.length} models`);

    // Run AI + image generation truly in parallel
    // Image gen uses raw prompt (concrete nouns work better for visual models)
    // AI generation uses the refined prompt
    let aiResult: Awaited<ReturnType<typeof generateLandingPage>>;
    let tmpImagePath: string | null;
    try {
      [tmpImagePath, aiResult] = await Promise.all([
        generateHeroImage(prompt),
        generateLandingPage(refinedPrompt, { apiKey, model: opts.model, siteType, themeMode }),
      ]);
    } catch (err) {
      spinner.stop('\x1b[31m✗\x1b[0m  Generation failed');
      console.error(`\n${String(err)}\n`);
      process.exit(1);
    }

    spinner.stop(`\x1b[32m✓\x1b[0m  ${aiResult.model.split('/').at(-1)} responded`);
    printSummary(aiResult.config as SummaryConfig);

    const scaffoldSpinner = startSpinner('Scaffolding project');
    let finalProjectDir: string;
    try {
      mkdirSync(outputDir, { recursive: true });
      finalProjectDir = scaffoldProject(
        aiResult.config as Parameters<typeof scaffoldProject>[0],
        outputDir,
        workspaceRoot,
        undefined,
        framework
      );
      scaffoldSpinner.stop('\x1b[32m✓\x1b[0m  Project created');
    } catch (err) {
      scaffoldSpinner.stop('\x1b[31m✗\x1b[0m  Scaffold failed');
      console.error(`\n${String(err)}\n`);
      process.exit(1);
    }

    // Copy temp image into the scaffolded project, then patch LandingPage.tsx
    if (tmpImagePath) {
      try {
        const destDir = join(finalProjectDir, 'public', 'images');
        mkdirSync(destDir, { recursive: true });
        copyFileSync(tmpImagePath, join(destDir, 'hero.jpg'));
        rewriteLandingPage(
          finalProjectDir,
          aiResult.config as Parameters<typeof rewriteLandingPage>[1],
          '/images/hero.jpg',
          framework
        );
        console.log(`  \x1b[32m✓\x1b[0m  Hero image ready`);
      } catch {
        console.log(`  \x1b[2m~\x1b[0m  Hero image skipped`);
      } finally {
        rmSync(tmpImagePath, { force: true });
      }
    } else {
      console.log(`  \x1b[2m~\x1b[0m  Hero image skipped (using placeholder)`);
    }

    const folderName  = finalProjectDir.split('/').at(-1) ?? finalProjectDir;
    const editPath    = framework === 'nextjs' ? 'src/components/LandingPage.tsx' : 'src/LandingPage.tsx';
    console.log(`\n  \x1b[1mNext steps\x1b[0m`);
    console.log(`  \x1b[36mcd ${folderName}\x1b[0m`);
    console.log(`  \x1b[36mnpm install\x1b[0m`);
    console.log(`  \x1b[36mnpm run dev\x1b[0m`);
    console.log(`\n  Then edit \x1b[33m${editPath}\x1b[0m to customise your page.\n`);
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
