import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { findWorkspaceRoot } from './preview.js';
import { toKebab, scaffoldProject } from './scaffold.js';

describe('toKebab', () => {
  it('lowercases and hyphenates normal names', () => {
    expect(toKebab('My Awesome Site')).toBe('my-awesome-site');
  });

  it('strips special characters', () => {
    expect(toKebab('Syncly Pro!')).toBe('syncly-pro');
  });

  it('collapses multiple spaces/separators into one hyphen', () => {
    expect(toKebab('Hello   World')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toKebab('  --My Site--  ')).toBe('my-site');
  });

  it('handles camelCase input', () => {
    expect(toKebab('myLandingPage')).toBe('mylandingpage');
  });

  it('handles already-kebab input unchanged', () => {
    expect(toKebab('my-site')).toBe('my-site');
  });

  it('returns fallback for empty/whitespace input', () => {
    expect(toKebab('')).toBe('landing-page');
    expect(toKebab('   ')).toBe('landing-page');
  });

  it('returns fallback for special-chars-only input', () => {
    expect(toKebab('!!!')).toBe('landing-page');
  });

  it('handles unicode gracefully by stripping non-ascii', () => {
    expect(toKebab('Café & Bistro')).toBe('caf-bistro');
  });

  it('handles numbers in names', () => {
    expect(toKebab('Studio 54')).toBe('studio-54');
  });
});

// ---------------------------------------------------------------------------
// scaffoldProject — integration tests (real filesystem, real templates)
// ---------------------------------------------------------------------------

const MIN_CONFIG = {
  metadata: {
    siteName: 'My Test Site',
    themeMode: 'dark' as const,
    fontFamily: 'sans',
    colors: { primary: '#6366f1', secondary: '#8b5cf6' },
  },
  sections: [
    { type: 'NAVBAR', variant: 'sticky',   content: { logo: 'Test', links: [] } },
    { type: 'HERO',   variant: 'centered', content: { title: 'Hi', subtitle: 'Sub', ctaText: 'Go' } },
    { type: 'CTA',    variant: 'centered', content: { title: 'Ready?', buttonText: 'Start' } },
  ],
};

let workspaceRoot: string;
let baseOutputDir: string;

beforeAll(() => {
  workspaceRoot = findWorkspaceRoot(
    new URL('.', import.meta.url).pathname,
    p => existsSync(p),
  );
  baseOutputDir = join(tmpdir(), `siteblaze-scaffold-test-${randomBytes(4).toString('hex')}`);
  mkdirSync(baseOutputDir, { recursive: true });
});

afterAll(() => {
  rmSync(baseOutputDir, { recursive: true, force: true });
});

describe('scaffoldProject — Vite (default)', () => {
  let projectDir: string;

  beforeAll(() => {
    projectDir = scaffoldProject(MIN_CONFIG, baseOutputDir, workspaceRoot);
  });

  it('returns the project directory path', () => {
    expect(typeof projectDir).toBe('string');
    expect(existsSync(projectDir)).toBe(true);
  });

  it('uses siteName as kebab-cased directory name', () => {
    expect(projectDir.endsWith('my-test-site')).toBe(true);
  });

  it('creates package.json with correct project name', () => {
    const pkg = JSON.parse(
      require('fs').readFileSync(join(projectDir, 'package.json'), 'utf-8')
    );
    expect(pkg.name).toBe('my-test-site');
    expect(pkg.scripts.dev).toBe('vite');
  });

  it('creates index.html for Vite', () => {
    expect(existsSync(join(projectDir, 'index.html'))).toBe(true);
  });

  it('creates vite.config.ts', () => {
    expect(existsSync(join(projectDir, 'vite.config.ts'))).toBe(true);
  });

  it('creates src/main.tsx', () => {
    expect(existsSync(join(projectDir, 'src', 'main.tsx'))).toBe(true);
  });

  it('creates src/Home.tsx with correct section imports', () => {
    const home = require('fs').readFileSync(join(projectDir, 'src', 'Home.tsx'), 'utf-8') as string;
    expect(home).toContain("import { Navbar }");
    expect(home).toContain("import { Hero }");
    expect(home).toContain("import { CTASection }");
  });

  it('creates section component files for each used type', () => {
    expect(existsSync(join(projectDir, 'src', 'sections', 'Navbar.tsx'))).toBe(true);
    expect(existsSync(join(projectDir, 'src', 'sections', 'Hero.tsx'))).toBe(true);
    expect(existsSync(join(projectDir, 'src', 'sections', 'CTASection.tsx'))).toBe(true);
  });

  it('creates theme.ts', () => {
    expect(existsSync(join(projectDir, 'src', 'theme.ts'))).toBe(true);
  });

  it('creates tailwind.config.js', () => {
    expect(existsSync(join(projectDir, 'tailwind.config.js'))).toBe(true);
  });

  it('creates .gitignore', () => {
    expect(existsSync(join(projectDir, '.gitignore'))).toBe(true);
  });

  it('creates public/images directory', () => {
    expect(existsSync(join(projectDir, 'public', 'images'))).toBe(true);
  });
});

describe('scaffoldProject — Next.js', () => {
  let projectDir: string;

  beforeAll(() => {
    const outDir = join(baseOutputDir, 'next');
    mkdirSync(outDir, { recursive: true });
    projectDir = scaffoldProject(MIN_CONFIG, outDir, workspaceRoot, undefined, 'nextjs');
  });

  it('creates next.config.ts', () => {
    expect(existsSync(join(projectDir, 'next.config.ts'))).toBe(true);
  });

  it('creates src/app/page.tsx', () => {
    expect(existsSync(join(projectDir, 'src', 'app', 'page.tsx'))).toBe(true);
  });

  it('creates src/app/layout.tsx', () => {
    expect(existsSync(join(projectDir, 'src', 'app', 'layout.tsx'))).toBe(true);
  });

  it('creates src/components/Home.tsx (not src/Home.tsx)', () => {
    expect(existsSync(join(projectDir, 'src', 'components', 'Home.tsx'))).toBe(true);
    expect(existsSync(join(projectDir, 'src', 'Home.tsx'))).toBe(false);
  });

  it('package.json has next dev script', () => {
    const pkg = JSON.parse(
      require('fs').readFileSync(join(projectDir, 'package.json'), 'utf-8')
    );
    expect(pkg.scripts.dev).toBe('next dev');
  });
});

describe('scaffoldProject — shadcn/ui extras', () => {
  let projectDir: string;

  beforeAll(() => {
    const outDir = join(baseOutputDir, 'shadcn');
    mkdirSync(outDir, { recursive: true });
    projectDir = scaffoldProject(MIN_CONFIG, outDir, workspaceRoot, undefined, 'vite', 'shadcn');
  });

  it('creates src/lib/utils.ts', () => {
    expect(existsSync(join(projectDir, 'src', 'lib', 'utils.ts'))).toBe(true);
  });

  it('creates components.json', () => {
    expect(existsSync(join(projectDir, 'components.json'))).toBe(true);
  });

  it('creates shadcn UI primitives', () => {
    expect(existsSync(join(projectDir, 'src', 'components', 'ui', 'button.tsx'))).toBe(true);
    expect(existsSync(join(projectDir, 'src', 'components', 'ui', 'card.tsx'))).toBe(true);
  });
});

describe('scaffoldProject — enableThemeToggle', () => {
  it('generates a static Home.tsx when enableThemeToggle is false', () => {
    const outDir = join(baseOutputDir, 'toggle-off');
    mkdirSync(outDir, { recursive: true });
    const dir = scaffoldProject({ ...MIN_CONFIG, metadata: { ...MIN_CONFIG.metadata, enableThemeToggle: false } }, outDir, workspaceRoot);
    const home = require('fs').readFileSync(join(dir, 'src', 'Home.tsx'), 'utf-8') as string;
    expect(home).not.toContain('useState');
    expect(home).not.toContain('THEME_CYCLE');
  });

  it('generates a stateful Home.tsx with toggle when enableThemeToggle is true', () => {
    const outDir = join(baseOutputDir, 'toggle-on');
    mkdirSync(outDir, { recursive: true });
    const dir = scaffoldProject({ ...MIN_CONFIG, metadata: { ...MIN_CONFIG.metadata, enableThemeToggle: true } }, outDir, workspaceRoot);
    const home = require('fs').readFileSync(join(dir, 'src', 'Home.tsx'), 'utf-8') as string;
    expect(home).toContain('useState');
    expect(home).toContain('THEME_CYCLE');
    expect(home).toContain('THEME_ICONS');
  });

  it('initialises theme state from config themeMode', () => {
    const outDir = join(baseOutputDir, 'toggle-midnight');
    mkdirSync(outDir, { recursive: true });
    const dir = scaffoldProject({ ...MIN_CONFIG, metadata: { ...MIN_CONFIG.metadata, themeMode: 'midnight', enableThemeToggle: true } }, outDir, workspaceRoot);
    const home = require('fs').readFileSync(join(dir, 'src', 'Home.tsx'), 'utf-8') as string;
    expect(home).toContain("useState<ThemeMode>('midnight')");
  });
});

describe('scaffoldProject — error cases', () => {
  it('throws ERR_DIR_EXISTS when output directory already exists', () => {
    const outDir = join(baseOutputDir, 'collision');
    mkdirSync(outDir, { recursive: true });

    scaffoldProject(MIN_CONFIG, outDir, workspaceRoot);

    expect(() => scaffoldProject(MIN_CONFIG, outDir, workspaceRoot)).toThrow('ERR_DIR_EXISTS');
  });

  it('accepts a custom project name override', () => {
    const outDir = join(baseOutputDir, 'override');
    mkdirSync(outDir, { recursive: true });
    const dir = scaffoldProject(MIN_CONFIG, outDir, workspaceRoot, undefined, 'vite', 'tailwind', 'custom-name');
    expect(dir.endsWith('custom-name')).toBe(true);
  });
});
