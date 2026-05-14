import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import type concurrently from 'concurrently';
import { startServer } from './server.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreviewDeps {
  cwd: () => string;
  fileExists: (path: string) => boolean;
  writeFile: (path: string, content: string) => void;
  run: typeof concurrently;
  workspaceRoot: string;
}

// ---------------------------------------------------------------------------
// Workspace root detection (pure — injected `check` makes it testable)
// ---------------------------------------------------------------------------

export function findWorkspaceRoot(
  from: string,
  check: (path: string) => boolean
): string {
  let dir = from;
  let prev = '';
  while (dir !== prev) {
    if (check(join(dir, 'nx.json'))) return dir;
    prev = dir;
    dir = dirname(dir);
  }
  throw new Error('Cannot find workspace root (no nx.json found).');
}

// ---------------------------------------------------------------------------
// Default config scaffold
// ---------------------------------------------------------------------------

export const defaultConfig = {
  metadata: {
    siteName: 'My Landing Page',
    themeMode: 'light',
    fontFamily: 'sans',
    colors: { primary: '#6366f1', secondary: '#8b5cf6' },
  },
  sections: [
    {
      type: 'NAVBAR',
      variant: 'sticky',
      content: {
        logo: 'MyApp',
        links: [
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
        ],
        ctaText: 'Get started',
      },
    },
    {
      type: 'HERO',
      variant: 'centered',
      content: {
        title: 'Welcome to My Landing Page',
        subtitle: 'Edit config.json in this directory to customise everything.',
        ctaText: 'Get started',
      },
    },
    {
      type: 'FEATURES',
      variant: 'grid',
      content: {
        title: 'Everything you need',
        items: [
          { icon: '🚀', title: 'Fast', description: 'Blazing fast performance out of the box.' },
          { icon: '🔒', title: 'Secure', description: 'Schema-validated so bad data never reaches the UI.' },
          { icon: '🎨', title: 'Themeable', description: 'Change colors, fonts, and variants to match your brand.' },
        ],
      },
    },
    {
      type: 'PRICING',
      variant: 'cards',
      content: {
        title: 'Simple pricing',
        tiers: [
          {
            name: 'Starter',
            price: 'Free',
            features: ['5 pages', 'Basic themes', 'Community support'],
            ctaText: 'Get started',
          },
          {
            name: 'Pro',
            price: '$19/mo',
            description: 'Everything you need to launch fast.',
            features: ['Unlimited pages', 'Custom domain', 'AI generator', 'Priority support'],
            ctaText: 'Start free trial',
            highlighted: true,
          },
        ],
      },
    },
    {
      type: 'CTA',
      variant: 'centered',
      content: { title: 'Ready to launch?', buttonText: 'Start building now' },
    },
  ],
};

// ---------------------------------------------------------------------------
// Embedded preview — single server, pre-built web app (published / npx mode)
// ---------------------------------------------------------------------------

export function runEmbeddedPreview(cwd: string): void {
  const configPath = join(cwd, 'config.json');

  if (existsSync(configPath)) {
    console.log(`✓  Using existing config.json`);
    startServer(configPath);
    return;
  }

  // No config.json in cwd — use a temp dir so we never write into a shared
  // location (npm cache, system dirs) when invoked via npx.
  const tmpDir = join(tmpdir(), `siteblaze-${randomBytes(4).toString('hex')}`);
  mkdirSync(tmpDir, { recursive: true });
  const tmpConfigPath = join(tmpDir, 'config.json');
  writeFileSync(tmpConfigPath, JSON.stringify(defaultConfig, null, 2));
  console.log(`✓  Created config.json in temp dir`);
  console.log(`  \x1b[2m${tmpConfigPath}\x1b[0m`);
  console.log(`  \x1b[2mCopy it to your project directory to persist changes.\x1b[0m`);

  startServer(tmpConfigPath);
}

// ---------------------------------------------------------------------------
// Monorepo dev preview — Vite dev server + tsx API (monorepo only)
// ---------------------------------------------------------------------------

export function runPreview(deps: PreviewDeps): void {
  const { cwd, fileExists, writeFile, run, workspaceRoot } = deps;
  const configPath = join(cwd(), 'config.json');

  if (!fileExists(configPath)) {
    writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`✓  Created config.json in ${cwd()}`);
  } else {
    console.log(`✓  Using existing config.json at ${configPath}`);
  }

  console.log('\n  API  →  http://localhost:3000');
  console.log('  Web  →  http://localhost:4200\n');

  const apiEntry = join(workspaceRoot, 'apps', 'api', 'src', 'index.ts');

  const { result } = run(
    [
      {
        command: `node --import tsx/esm ${apiEntry}`,
        name: 'api',
        prefixColor: 'blue',
        env: { ...process.env, CONFIG_PATH: configPath },
      },
      {
        command: 'npx nx dev @org/web',
        name: 'web',
        prefixColor: 'magenta',
        cwd: workspaceRoot,
      },
    ],
    { killOthers: ['failure'], prefix: 'name' }
  );

  result.catch(() => process.exit(1));
}
