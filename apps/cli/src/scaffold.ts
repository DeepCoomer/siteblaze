import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Published mode: templates/ sits next to dist/
// Monorepo dev mode: fall back to libs source
export function getTemplatesDir(workspaceRoot: string | null): string {
  const publishedDir = join(__dirname, '..', 'templates');
  if (existsSync(publishedDir)) return publishedDir;
  if (workspaceRoot) return join(workspaceRoot, 'libs', 'ui-elements', 'src', 'lib');
  throw new Error('Cannot find templates directory — try reinstalling landing-engine.');
}

const SECTION_MAP: Record<string, { file: string; component: string }> = {
  NAVBAR:         { file: 'Navbar.tsx',        component: 'Navbar' },
  HERO:           { file: 'Hero.tsx',           component: 'Hero' },
  FEATURES:       { file: 'Features.tsx',       component: 'Features' },
  CTA:            { file: 'CTASection.tsx',     component: 'CTASection' },
  TESTIMONIALS:   { file: 'Testimonials.tsx',   component: 'Testimonials' },
  PRICING:        { file: 'Pricing.tsx',        component: 'Pricing' },
  FAQ:            { file: 'FAQ.tsx',            component: 'FAQ' },
  STATS:          { file: 'Stats.tsx',          component: 'Stats' },
  TEAM:           { file: 'Team.tsx',           component: 'Team' },
  NEWSLETTER:     { file: 'Newsletter.tsx',     component: 'Newsletter' },
  LOGO_CLOUD:     { file: 'LogoCloud.tsx',      component: 'LogoCloud' },
  SKILLS:         { file: 'Skills.tsx',         component: 'Skills' },
  TIMELINE:       { file: 'Timeline.tsx',       component: 'Timeline' },
  PORTFOLIO_GRID: { file: 'PortfolioGrid.tsx',  component: 'PortfolioGrid' },
  CONTACT_FORM:   { file: 'ContactForm.tsx',    component: 'ContactForm' },
  GALLERY:        { file: 'Gallery.tsx',        component: 'Gallery' },
  PRODUCT_GRID:   { file: 'ProductGrid.tsx',    component: 'ProductGrid' },
  TRUST_BADGES:   { file: 'TrustBadges.tsx',    component: 'TrustBadges' },
  COUNTDOWN:      { file: 'Countdown.tsx',       component: 'Countdown' },
  SCHEDULE:       { file: 'Schedule.tsx',        component: 'Schedule' },
  CASE_STUDY:     { file: 'CaseStudy.tsx',       component: 'CaseStudy' },
  VIDEO_EMBED:    { file: 'VideoEmbed.tsx',      component: 'VideoEmbed' },
};

export type ScaffoldConfig = {
  metadata: {
    siteName: string;
    themeMode?: string;
    fontFamily?: string;
    colors: { primary: string; secondary: string };
  };
  sections: Array<{ type: string; variant?: string; content: unknown }>;
};

export function toKebab(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'landing-page';
}

// Rewrite './theme.js' imports to '../theme' for the sections/ subdirectory
function rewriteThemeImport(source: string): string {
  return source.replace(/from ['"]\.\/theme\.js['"]/g, "from '../theme'");
}

const THEME_BG: Record<string, string> = {
  light:    'bg-white text-gray-900',
  dark:     'bg-gray-900 text-gray-100',
  midnight: 'bg-slate-950 text-white',
};
const FONT_CLASS: Record<string, string> = {
  sans:  'font-sans',
  serif: 'font-serif',
  mono:  'font-mono',
};

export type Framework = 'vite' | 'nextjs';

function generateLandingPageTsx(
  config: ScaffoldConfig,
  usedTypes: string[],
  heroImageUrl?: string,
  framework: Framework = 'vite'
): string {
  const { colors, themeMode = 'light', fontFamily = 'sans' } = config.metadata;

  const imports = usedTypes
    .map((t) => {
      const info = SECTION_MAP[t];
      return `import { ${info.component} } from './sections/${info.file.replace('.tsx', '')}';`;
    })
    .join('\n');

  const bgClass   = THEME_BG[themeMode]   ?? THEME_BG['light'];
  const fontClass = FONT_CLASS[fontFamily] ?? FONT_CLASS['sans'];
  // Next.js App Router requires "use client" for components with event handlers
  const directive = framework === 'nextjs' ? `'use client';\n\n` : '';

  const sectionJsx = config.sections.map((section) => {
    const info = SECTION_MAP[section.type];
    if (!info) return `      {/* Unknown section: ${section.type} */}`;

    const content =
      section.type === 'HERO' && heroImageUrl
        ? { ...(section.content as object), imageUrl: heroImageUrl }
        : section.content;

    const contentLines = JSON.stringify(content, null, 4)
      .split('\n')
      .map((line, i) => (i === 0 ? line : '        ' + line))
      .join('\n');
    const variantProp = section.variant ? `\n        variant="${section.variant}"` : '';
    return `      <${info.component}${variantProp}\n        content={${contentLines}}\n        theme={theme}\n      />`;
  }).join('\n');

  return `${directive}import React from 'react';
import type { Theme } from './theme';
${imports}

const theme: Theme = {
  colors: { primary: '${colors.primary}', secondary: '${colors.secondary}' },
  themeMode: '${themeMode}',
  fontFamily: '${fontFamily}',
};

export function LandingPage() {
  return (
    <main
      className="min-h-screen ${bgClass} ${fontClass}"
      style={{ '--color-primary': '${colors.primary}', '--color-secondary': '${colors.secondary}' } as React.CSSProperties}
    >
${sectionJsx}
    </main>
  );
}
`;
}

export function scaffoldProject(
  config: ScaffoldConfig,
  outputDir: string,
  workspaceRoot: string | null,
  heroImageUrl?: string,
  framework: Framework = 'vite'
): string {
  const templatesDir = getTemplatesDir(workspaceRoot);
  const projectName  = toKebab(config.metadata.siteName);
  const projectDir   = join(outputDir, projectName);

  if (existsSync(projectDir)) {
    throw new Error(`Directory already exists: ${projectDir}\nDelete it first, or use a different prompt.`);
  }

  const usedTypes = [...new Set(config.sections.map((s) => s.type))].filter((t) => t in SECTION_MAP);

  // Components live at src/ (Vite) or src/components/ (Next.js)
  const componentsDir = framework === 'nextjs'
    ? join(projectDir, 'src', 'components')
    : join(projectDir, 'src');

  mkdirSync(join(componentsDir, 'sections'), { recursive: true });
  mkdirSync(join(projectDir, 'public', 'images'), { recursive: true });

  // theme.ts
  writeFileSync(
    join(componentsDir, 'theme.ts'),
    readFileSync(join(templatesDir, 'theme.ts'), 'utf-8')
  );

  // Section components — rewrite './theme.js' → '../theme'
  for (const type of usedTypes) {
    const { file } = SECTION_MAP[type];
    const src = readFileSync(join(templatesDir, file), 'utf-8');
    writeFileSync(join(componentsDir, 'sections', file), rewriteThemeImport(src));
  }

  // LandingPage.tsx
  writeFileSync(
    join(componentsDir, 'LandingPage.tsx'),
    generateLandingPageTsx(config, usedTypes, heroImageUrl, framework)
  );

  if (framework === 'nextjs') {
    // ── Next.js scaffold ───────────────────────────────────────────────────
    mkdirSync(join(projectDir, 'src', 'app'), { recursive: true });

    writeFileSync(join(projectDir, 'src', 'app', 'globals.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;
`);

    writeFileSync(join(projectDir, 'src', 'app', 'layout.tsx'), `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${config.metadata.siteName}',
  description: 'Generated by landing-engine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`);

    writeFileSync(join(projectDir, 'src', 'app', 'page.tsx'), `import { LandingPage } from '../components/LandingPage';

export default function Page() {
  return <LandingPage />;
}
`);

    writeFileSync(join(projectDir, 'next.config.ts'), `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
`);

    writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: projectName,
      private: true,
      version: '0.1.0',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: {
        typescript: '^5.4.0',
        '@types/node': '^20.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
      },
    }, null, 2));

    writeFileSync(join(projectDir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }, null, 2));

    writeFileSync(join(projectDir, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
};
`);

    writeFileSync(join(projectDir, 'postcss.config.js'), `module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
`);

  } else {
    // ── Vite scaffold ──────────────────────────────────────────────────────
    writeFileSync(join(projectDir, 'src', 'main.tsx'), `import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './LandingPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>
);
`);

    writeFileSync(join(projectDir, 'src', 'index.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;
`);

    writeFileSync(join(projectDir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.metadata.siteName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

    writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: projectName,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: {
        typescript: '^5.4.0',
        vite: '^6.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
      },
    }, null, 2));

    writeFileSync(join(projectDir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
      },
      include: ['src'],
    }, null, 2));

    writeFileSync(join(projectDir, 'vite.config.ts'), `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`);

    writeFileSync(join(projectDir, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
`);

    writeFileSync(join(projectDir, 'postcss.config.js'), `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
`);
  }

  writeFileSync(join(projectDir, '.gitignore'), `node_modules
dist
.next
.env
.env.local
`);

  return projectDir;
}

/**
 * Overwrites src/LandingPage.tsx with a new version that includes the hero
 * image URL. Called after the image has been downloaded and placed in
 * public/images/hero.jpg.
 */
export function rewriteLandingPage(
  projectDir: string,
  config: ScaffoldConfig,
  heroImageUrl: string,
  framework: Framework = 'vite'
): void {
  const usedTypes = [...new Set(config.sections.map((s) => s.type))].filter(
    (t) => t in SECTION_MAP
  );
  const componentsDir = framework === 'nextjs'
    ? join(projectDir, 'src', 'components')
    : join(projectDir, 'src');
  writeFileSync(
    join(componentsDir, 'LandingPage.tsx'),
    generateLandingPageTsx(config, usedTypes, heroImageUrl, framework)
  );
}
