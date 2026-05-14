#!/usr/bin/env node
import { Command } from 'commander';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import concurrently from 'concurrently';
import { findWorkspaceRoot, runPreview, runEmbeddedPreview } from './preview.js';
import { eject } from './eject.js';
import { scaffoldProject, rewriteHome, toKebab, type Framework, type UiLib } from './scaffold.js';
import { resolveApiKey, configureAuth } from './auth.js';
import { generateHeroImage } from './images.js';
import { resolveRaceModels, saveModels, loadSavedModelsInfo, fetchFreeModels } from './models.js';
import { generateLandingPage, refinePrompt, FREE_MODELS, MODEL_NOTES, type SiteType, type ThemeOverride, inferSiteType, extractCategoryHint } from '@org/engine-core';
import { isPublishedMode } from './server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { version: CLI_VERSION } = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
) as { version: string };

// ---------------------------------------------------------------------------
// Package manager detection
// ---------------------------------------------------------------------------

type PkgManager = 'npm' | 'pnpm' | 'bun' | 'yarn';

const PKG_MANAGERS: PkgManager[] = ['npm', 'pnpm', 'bun', 'yarn'];

function detectPackageManager(cwd: string): PkgManager {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'bun.lockb')))      return 'bun';
  if (existsSync(join(cwd, 'yarn.lock')))       return 'yarn';
  return 'npm';
}

async function confirmPackageManager(cwd: string): Promise<PkgManager> {
  const detected = detectPackageManager(cwd);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));

  const opts = PKG_MANAGERS.map((pm, i) => {
    const marker = pm === detected ? ` \x1b[2m(detected)\x1b[0m` : '';
    return `\x1b[36m${i + 1}\x1b[0m ${pm}${marker}`;
  }).join('   ');

  console.log(`  \x1b[2mPackage manager:\x1b[0m  ${opts}`);
  const defaultIdx = PKG_MANAGERS.indexOf(detected) + 1;
  const answer = await ask(`  Choose [1-4] — default ${detected}:  `);
  rl.close();
  console.log();

  const idx = parseInt(answer.trim(), 10) - 1;
  return (idx >= 0 && idx < PKG_MANAGERS.length) ? PKG_MANAGERS[idx] : detected;
}

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
    `  \x1b[35m│\x1b[0m   \x1b[1m\x1b[35m◆\x1b[0m  \x1b[1msiteblaze\x1b[0m  \x1b[2mv${CLI_VERSION}\x1b[0m                \x1b[35m│\x1b[0m`,
    `  \x1b[35m│\x1b[0m      \x1b[2mGenerate · Scaffold · Ship\x1b[0m       \x1b[35m│\x1b[0m`,
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
// UI library confirmation
// ---------------------------------------------------------------------------

async function confirmUiLib(explicit?: string): Promise<UiLib> {
  if (explicit === 'tailwind' || explicit === 'shadcn') return explicit;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));

  console.log(`  \x1b[2mUI Library:\x1b[0m  \x1b[36m1\x1b[0m Default  \x1b[2m(plain Tailwind)\x1b[0m   \x1b[36m2\x1b[0m shadcn/ui  \x1b[2m(component library)\x1b[0m`);
  const answer = await ask('  Choose [1/2] — default plain Tailwind:  ');
  rl.close();
  console.log();
  return answer.trim() === '2' ? 'shadcn' : 'tailwind';
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('siteblaze')
  .description('AI-powered site generator — from prompt to production-ready React project')
  .version(CLI_VERSION)
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
  .option('--ui <lib>', 'UI library: tailwind | shadcn (prompted if omitted)')
  .option('--no-image', 'Skip hero image generation')
  .option('-y, --yes', 'Skip all prompts and use defaults (vite, tailwind, npm, AI picks theme and name)')
  .option('--verbose', 'Show model details and internal progress')
  .action(async (prompt: string, opts: { model?: string; output?: string; type?: string; framework?: string; theme?: string; ui?: string; image: boolean; yes?: boolean; verbose?: boolean }) => {
    const outputDir = opts.output ? resolve(opts.output) : process.cwd();

    const apiKey = await resolveApiKey(loadEnvKey(process.cwd(), 'OPENROUTER_API_KEY'));

    const raceModels = resolveRaceModels();

    if (opts.verbose) {
      if (opts.model) {
        console.log(`\x1b[2mModel: ${opts.model}\x1b[0m\n`);
      } else {
        const src = process.env['SITEBLAZE_MODELS'] ? 'SITEBLAZE_MODELS env' : loadSavedModelsInfo() ? 'saved config' : 'defaults';
        const verb = raceModels.length === 1 ? 'Using' : 'Racing';
        const tail = raceModels.length === 1 ? '' : ' — first valid response wins';
        console.log(`\x1b[2m${verb} ${raceModels.length} model${raceModels.length === 1 ? '' : 's'} (${src})${tail}\x1b[0m\n`);
      }
    }

    // Resolve site category hint sent to the AI.
    // --type flag skips confirmation; otherwise extract a category hint
    // (may be a known type name or a free-form label like "restaurant")
    // and ask the user to confirm.
    const detectedCategory = opts.type ?? extractCategoryHint(prompt);
    const siteType = (opts.yes || opts.type)
      ? detectedCategory
      : await confirmSiteType(detectedCategory);

    const framework   = opts.yes ? 'vite'     : await confirmFramework(opts.framework);
    const uiLib       = opts.yes ? 'tailwind'  : await confirmUiLib(opts.ui);
    const themeMode   = opts.yes ? undefined   : await confirmTheme(opts.theme);
    const pkgManager  = opts.yes ? detectPackageManager(process.cwd()) : await confirmPackageManager(process.cwd());

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

    const spinner = startSpinner('Generating your landing page');

    // Run AI + image generation truly in parallel
    // Image gen uses raw prompt (concrete nouns work better for visual models)
    // AI generation uses the refined prompt
    let aiResult: Awaited<ReturnType<typeof generateLandingPage>>;
    let tmpImagePath: string | null;
    try {
      [tmpImagePath, aiResult] = await Promise.all([
        opts.image ? generateHeroImage(prompt) : Promise.resolve(null),
        generateLandingPage(refinedPrompt, { apiKey, model: opts.model, models: raceModels, siteType, themeMode }),
      ]);
    } catch (err) {
      spinner.stop('\x1b[31m✗\x1b[0m  Generation failed');
      const msg = String(err);
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        console.error('\n  Invalid API key. Run \x1b[36msiteblaze auth\x1b[0m to update it.\n');
      } else if (msg.includes('All models failed') || msg.includes('aborted')) {
        console.error('\n  All AI models failed to respond. Check your connection or try again.');
        console.error('  Use \x1b[36m--model <id>\x1b[0m to target a specific model.\n');
      } else {
        console.error(`\n  ${msg}\n`);
      }
      process.exit(1);
    }

    const modelLabel = opts.verbose ? `  \x1b[2m${aiResult.model}\x1b[0m` : '';
    spinner.stop(`\x1b[32m✓\x1b[0m  Landing page generated${modelLabel}`);
    printSummary(aiResult.config as SummaryConfig);

    // Project name confirmation
    const aiSlug = toKebab(aiResult.config.metadata.siteName);
    let projectSlug = aiSlug;
    if (!opts.yes) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const raw = await new Promise<string>(res => rl.question(
        `  App name: \x1b[36m${aiSlug}\x1b[0m  \x1b[2m(sets folder + package.json name — Enter to confirm)\x1b[0m  `,
        res
      ));
      rl.close();
      console.log();
      const trimmed = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (trimmed) projectSlug = trimmed;
    }

    // Check for directory conflict before scaffolding — ask to overwrite
    const expectedDir = join(outputDir, projectSlug);
    if (existsSync(expectedDir)) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>(res => rl.question(
        `\n  \x1b[33m!\x1b[0m  Directory \x1b[1m${expectedDir.split('/').at(-1)}\x1b[0m already exists. Overwrite? [y/N]  `,
        res
      ));
      rl.close();
      console.log();
      if (answer.trim().toLowerCase() !== 'y') {
        console.log('  Aborted.\n');
        process.exit(0);
      }
      rmSync(expectedDir, { recursive: true });
    }

    const scaffoldSpinner = startSpinner('Scaffolding project');
    let finalProjectDir: string;
    try {
      mkdirSync(outputDir, { recursive: true });
      finalProjectDir = scaffoldProject(
        aiResult.config as Parameters<typeof scaffoldProject>[0],
        outputDir,
        workspaceRoot,
        undefined,
        framework,
        uiLib,
        projectSlug
      );
      scaffoldSpinner.stop('\x1b[32m✓\x1b[0m  Project created');
    } catch (err) {
      scaffoldSpinner.stop('\x1b[31m✗\x1b[0m  Scaffold failed');
      const msg = String(err);
      if (msg.startsWith('Error: ERR_DIR_EXISTS:')) {
        const dir = msg.replace('Error: ERR_DIR_EXISTS:', '');
        console.error(`\n  Directory already exists: \x1b[1m${dir}\x1b[0m\n`);
      } else {
        console.error(`\n  ${msg}\n`);
      }
      process.exit(1);
    }

    // Copy temp image into the scaffolded project, then patch LandingPage.tsx
    if (tmpImagePath) {
      try {
        const destDir = join(finalProjectDir, 'public', 'images');
        mkdirSync(destDir, { recursive: true });
        copyFileSync(tmpImagePath, join(destDir, 'hero.jpg'));
        rewriteHome(
          finalProjectDir,
          aiResult.config as Parameters<typeof rewriteHome>[1],
          '/images/hero.jpg',
          framework,
          uiLib
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
    const editPath    = framework === 'nextjs' ? 'src/components/Home.tsx' : 'src/Home.tsx';
    const runCmd      = pkgManager === 'npm' ? 'npm run dev' : `${pkgManager} dev`;
    console.log(`\n  \x1b[1mNext steps\x1b[0m`);
    console.log(`  \x1b[36mcd ${folderName}\x1b[0m`);
    console.log(`  \x1b[36m${pkgManager} install\x1b[0m`);
    console.log(`  \x1b[36m${runCmd}\x1b[0m`);
    if (uiLib === 'shadcn') {
      console.log(`\n  \x1b[2mshadcn/ui components are in src/components/ui/\x1b[0m`);
      console.log(`  \x1b[2mAdd more: npx shadcn@latest add <component>\x1b[0m`);
    }
    console.log(`\n  Then edit \x1b[33m${editPath}\x1b[0m to customise your page.\n`);

    // Git init
    let initGit = opts.yes;
    if (!opts.yes) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>(res => rl.question(
        `  Initialise a git repository? \x1b[2m[Y/n]\x1b[0m  `, res
      ));
      rl.close();
      console.log();
      initGit = answer.trim().toLowerCase() !== 'n';
    }
    if (initGit) {
      try {
        execSync('git init', { cwd: finalProjectDir, stdio: 'ignore' });
        execSync('git add .', { cwd: finalProjectDir, stdio: 'ignore' });
        execSync('git commit -m "Initial commit"', { cwd: finalProjectDir, stdio: 'ignore' });
        console.log(`  \x1b[32m✓\x1b[0m  Git repository initialised\n`);
      } catch {
        console.log(`  \x1b[2m~\x1b[0m  Git init skipped (git not available or not configured)\n`);
      }
    }
  });

// ── list-models ───────────────────────────────────────────────────────────────

program
  .command('list-models')
  .description('List models used for generation — use --refresh to fetch latest from OpenRouter')
  .option('--refresh', 'Fetch current free models from OpenRouter and save for future runs')
  .action(async (opts: { refresh?: boolean }) => {
    if (opts.refresh) {
      const apiKey = await resolveApiKey(loadEnvKey(process.cwd(), 'OPENROUTER_API_KEY'));
      process.stdout.write('  Fetching models from OpenRouter…');
      let fetched: string[];
      try {
        fetched = await fetchFreeModels(apiKey);
        process.stdout.write('\r\x1b[2K');
      } catch (err) {
        process.stdout.write('\r\x1b[2K');
        console.error(`  \x1b[31m✗\x1b[0m  Failed to fetch models: ${String(err)}\n`);
        process.exit(1);
      }
      saveModels(fetched);
      console.log(`  \x1b[32m✓\x1b[0m  Saved ${fetched.length} free models to \x1b[2m~/.config/siteblaze/models.json\x1b[0m`);
      console.log(`  \x1b[2mThese will be used for all future generation races.\x1b[0m\n`);
      fetched.slice(0, 20).forEach((id, i) => {
        const num = `\x1b[2m${String(i + 1).padStart(2)}.\x1b[0m`;
        console.log(`  ${num}  \x1b[36m${id}\x1b[0m`);
      });
      if (fetched.length > 20) {
        console.log(`  \x1b[2m  … and ${fetched.length - 20} more\x1b[0m`);
      }
      console.log(`\n  Set \x1b[33mSITEBLAZE_MODELS=model1,model2\x1b[0m to use specific models only.\n`);
      return;
    }

    const active = resolveRaceModels();
    const savedInfo = loadSavedModelsInfo();
    const source = process.env['SITEBLAZE_MODELS']
      ? '\x1b[33mSITEBLAZE_MODELS\x1b[0m env var'
      : savedInfo
        ? `\x1b[2msaved config (${savedInfo.updatedAt.slice(0, 10)})\x1b[0m`
        : '\x1b[2mbuilt-in defaults\x1b[0m';

    console.log(`\n  \x1b[1mActive models\x1b[0m  \x1b[2m(source: ${source})\x1b[0m\n`);
    active.forEach((id, i) => {
      const note = MODEL_NOTES[id] ?? '';
      const num = `\x1b[2m${String(i + 1).padStart(2)}.\x1b[0m`;
      console.log(`  ${num}  \x1b[36m${id.padEnd(52)}\x1b[0m \x1b[2m${note}\x1b[0m`);
    });
    console.log(`\n  \x1b[2mRun \x1b[0msiteblaze list-models --refresh\x1b[2m to fetch the latest free models from OpenRouter.\x1b[0m`);
    console.log(`  \x1b[2mSet \x1b[0mSITEBLAZE_MODELS=model1,model2\x1b[2m to use specific models (e.g. paid ones).\x1b[0m`);
    console.log(`  Use \x1b[33m--model <id>\x1b[0m to target a single model for one generation.\n`);
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
