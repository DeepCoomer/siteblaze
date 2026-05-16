#!/usr/bin/env node
import { Command } from 'commander';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import * as clack from '@clack/prompts';
import { join, dirname, resolve } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { findWorkspaceRoot } from './preview.js';
import { startServer, isPublishedMode } from './server.js';
import { scaffoldProject, rewriteHome, toKebab, type Framework, type UiLib } from './scaffold.js';
import { resolveApiKey, configureAuth } from './auth.js';
import { saveToHistory, listHistory, loadHistoryConfig } from './history.js';
import { generateHeroImage } from './images.js';
import { resolveRaceModels, saveModels, loadSavedModelsInfo, fetchFreeModels } from './models.js';
import { generateLandingPage, refinePrompt, FREE_MODELS, MODEL_NOTES, type SiteType, type ThemeOverride, inferSiteType, extractCategoryHint } from '@org/engine-core';

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

function onCancel(): never {
  clack.cancel('Cancelled.');
  process.exit(0);
}

async function confirmPackageManager(cwd: string): Promise<PkgManager> {
  const detected = detectPackageManager(cwd);
  const result = await clack.select({
    message: 'Package manager',
    options: PKG_MANAGERS.map(pm => ({
      value: pm,
      label: pm,
      hint: pm === detected ? 'detected' : undefined,
    })),
    initialValue: detected,
  });
  if (clack.isCancel(result)) onCancel();
  return result as PkgManager;
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
  const knownDesc = SITE_TYPE_DESC[detected as SiteType];
  const message = knownDesc ? `Site type: ${detected} — ${knownDesc}` : `Site type: ${detected}`;

  const confirmed = await clack.confirm({ message: `${message}. Correct?`, initialValue: true });
  if (clack.isCancel(confirmed)) onCancel();
  if (confirmed) return detected;

  const pick = await clack.select({
    message: 'Choose a site type',
    options: [
      ...SITE_TYPES.map(t => ({ value: t as string, label: t, hint: SITE_TYPE_DESC[t] })),
      { value: '__custom__', label: 'Custom', hint: 'e.g. restaurant, gym, real estate' },
    ],
  });
  if (clack.isCancel(pick)) onCancel();

  if (pick === '__custom__') {
    const custom = await clack.text({
      message: 'Custom category',
      placeholder: 'e.g. restaurant, gym, real estate',
      validate: v => v?.trim() ? undefined : 'Please enter a category',
    });
    if (clack.isCancel(custom)) onCancel();
    return (custom as string).trim().toLowerCase();
  }

  return pick as string;
}

// ---------------------------------------------------------------------------
// Theme confirmation
// ---------------------------------------------------------------------------

async function confirmTheme(explicit?: string): Promise<ThemeOverride | undefined> {
  if (explicit === 'light' || explicit === 'dark' || explicit === 'midnight') return explicit;

  const result = await clack.select({
    message: 'Theme',
    options: [
      { value: '__ai__',   label: 'AI picks',  hint: 'chosen based on your prompt' },
      { value: 'light',    label: 'Light' },
      { value: 'dark',     label: 'Dark' },
      { value: 'midnight', label: 'Midnight' },
    ],
    initialValue: '__ai__',
  });
  if (clack.isCancel(result)) onCancel();
  return result === '__ai__' ? undefined : result as ThemeOverride;
}

// ---------------------------------------------------------------------------
// Framework confirmation
// ---------------------------------------------------------------------------

async function confirmFramework(explicit?: string): Promise<Framework> {
  if (explicit === 'nextjs' || explicit === 'next') return 'nextjs';
  if (explicit === 'vite') return 'vite';

  const result = await clack.select({
    message: 'Framework',
    options: [
      { value: 'vite',   label: 'Vite',    hint: 'SPA · fast dev server' },
      { value: 'nextjs', label: 'Next.js', hint: 'SSR · file-based routing' },
    ],
    initialValue: 'vite',
  });
  if (clack.isCancel(result)) onCancel();
  return result as Framework;
}

// ---------------------------------------------------------------------------
// UI library confirmation
// ---------------------------------------------------------------------------

async function confirmUiLib(explicit?: string): Promise<UiLib> {
  if (explicit === 'tailwind' || explicit === 'shadcn') return explicit;

  const result = await clack.select({
    message: 'UI library',
    options: [
      { value: 'tailwind', label: 'Tailwind CSS', hint: 'plain utility classes' },
      { value: 'shadcn',   label: 'shadcn/ui',    hint: 'component library' },
    ],
    initialValue: 'tailwind',
  });
  if (clack.isCancel(result)) onCancel();
  return result as UiLib;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name('siteblaze')
  .description('AI picks sections, not code. Clean React. Free. Yours.')
  .version(CLI_VERSION)
  .hook('preAction', printBanner);


// ── generate ─────────────────────────────────────────────────────────────────

program
  .command('generate <prompt>')
  .description('Generate a complete React + Tailwind project from a text prompt using AI')
  .option('-m, --model <model>', 'Specific OpenRouter model ID (omit to race all free models)')
  .option('-o, --output <path>', 'Directory to create the project in (default: current directory)')
  .option('-t, --type <type>', 'Site type: landing | portfolio | agency | saas | blog | ecommerce | event (auto-detected if omitted)')
  .option('-f, --framework <fw>', 'Output framework: vite | next (prompted if omitted)')
  .option('--theme <theme>', 'Theme mode: light | dark | midnight (prompted if omitted)')
  .option('--ui <lib>', 'UI library: tailwind | shadcn (prompted if omitted)')
  .option('--no-image', 'Skip hero image generation')
  .option('-y, --yes', 'Skip all prompts and use defaults (vite, tailwind, npm, AI picks theme and name)')
  .option('--verbose', 'Show model details and internal progress')
  .option('--preview', 'Open in browser preview instead of scaffolding to disk — edit and download from the UI')
  .action(async (prompt: string, opts: { model?: string; output?: string; type?: string; framework?: string; theme?: string; ui?: string; image: boolean; yes?: boolean; verbose?: boolean; preview?: boolean }) => {
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

    const framework   = opts.framework ? await confirmFramework(opts.framework) : opts.yes ? 'vite'    : await confirmFramework();
    const uiLib       = opts.ui        ? await confirmUiLib(opts.ui)           : opts.yes ? 'tailwind' : await confirmUiLib();
    const themeMode   = opts.theme     ? await confirmTheme(opts.theme)        : opts.yes ? undefined  : await confirmTheme();
    const pkgManager  = opts.yes ? detectPackageManager(process.cwd()) : await confirmPackageManager(process.cwd());

    // Refine terse prompts before generation — skipped for detailed prompts (>=12 words)
    let refinedPrompt = prompt;
    if (prompt.trim().split(/\s+/).length < 12) {
      const refineSpinner = startSpinner('Expanding prompt');
      try {
        refinedPrompt = await refinePrompt(prompt, apiKey);
        refineSpinner.stop(
          refinedPrompt !== prompt
            ? `\x1b[32m✓\x1b[0m  Prompt expanded`
            : `\x1b[2m~\x1b[0m  Prompt used as-is`
        );
      } catch {
        refineSpinner.stop(`\x1b[2m~\x1b[0m  Prompt expansion skipped`);
      }
    }

    const spinner = startSpinner('Generating your site');

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
    spinner.stop(`\x1b[32m✓\x1b[0m  Site generated${modelLabel}`);

    if (aiResult.deprecatedModels?.length) {
      console.log(`\x1b[33m⚠  ${aiResult.deprecatedModels.length} model${aiResult.deprecatedModels.length === 1 ? '' : 's'} appear deprecated: ${aiResult.deprecatedModels.join(', ')}\x1b[0m`);
      console.log(`\x1b[2m   Run \x1b[0msiteblaze list-models --refresh\x1b[2m to update your model list.\x1b[0m\n`);
    }

    printSummary(aiResult.config as SummaryConfig);

    saveToHistory(aiResult.config, prompt);

    // ── Preview mode — open in browser, nothing written to disk yet ──────────
    if (opts.preview) {
      const tempDir = join(tmpdir(), `siteblaze-preview-${randomBytes(4).toString('hex')}`);
      mkdirSync(tempDir, { recursive: true });
      const configPath = join(tempDir, 'config.json');
      writeFileSync(configPath, JSON.stringify(aiResult.config, null, 2));
      console.log(`  \x1b[2mOpening preview — edit in browser, then click Download Project\x1b[0m`);
      console.log(`  \x1b[2mPress Ctrl+C to stop.\x1b[0m\n`);
      const cleanupPreview = () => {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
        process.exit(0);
      };
      process.once('SIGINT', cleanupPreview);
      process.once('SIGTERM', cleanupPreview);
      startServer(configPath);
      return;
    }

    // Project name confirmation
    const aiSlug = toKebab(aiResult.config.metadata.siteName);
    let projectSlug = aiSlug;
    if (!opts.yes) {
      const raw = await clack.text({
        message: 'App name',
        placeholder: aiSlug,
        defaultValue: aiSlug,
      });
      if (clack.isCancel(raw)) onCancel();
      const trimmed = (raw as string).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (trimmed) projectSlug = trimmed;
    }

    // Check for directory conflict before scaffolding — ask to overwrite
    const expectedDir = join(outputDir, projectSlug);
    if (existsSync(expectedDir)) {
      const overwrite = await clack.confirm({
        message: `Directory "${projectSlug}" already exists. Overwrite?`,
        initialValue: false,
      });
      if (clack.isCancel(overwrite)) onCancel();
      if (!overwrite) {
        clack.cancel('Aborted.');
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
      const doGit = await clack.confirm({
        message: 'Initialise a git repository?',
        initialValue: true,
      });
      if (clack.isCancel(doGit)) onCancel();
      initGit = doGit as boolean;
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

// ── open ──────────────────────────────────────────────────────────────────────

program
  .command('open')
  .description('Re-open a previously generated site in the browser editor')
  .action(async () => {
    const entries = listHistory();

    if (entries.length === 0) {
      clack.log.info('No history found. Run siteblaze generate to create your first site.');
      return;
    }

    const choice = await clack.select({
      message: 'Choose a generation to re-open',
      options: entries.map(e => ({
        value: e.path,
        label: e.siteName,
        hint: `${e.prompt.length > 50 ? e.prompt.slice(0, 50) + '…' : e.prompt} · ${new Date(e.savedAt).toLocaleDateString()}`,
      })),
    });

    if (clack.isCancel(choice)) {
      clack.cancel('Cancelled.');
      process.exit(0);
    }

    const config = loadHistoryConfig(choice as string);
    const tempDir = join(tmpdir(), `siteblaze-preview-${randomBytes(4).toString('hex')}`);
    mkdirSync(tempDir, { recursive: true });
    const configPath = join(tempDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`  \x1b[2mOpening preview — edit in browser, then click Download Project\x1b[0m`);
    console.log(`  \x1b[2mPress Ctrl+C to stop.\x1b[0m\n`);

    const cleanup = () => {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
      process.exit(0);
    };
    process.once('SIGINT', cleanup);
    process.once('SIGTERM', cleanup);

    startServer(configPath);
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

program.parse(process.argv);
