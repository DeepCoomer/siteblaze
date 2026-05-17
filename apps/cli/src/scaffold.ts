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
  throw new Error('Cannot find templates directory — try reinstalling siteblaze.');
}

const SECTION_MAP: Record<string, { file: string; component: string; shadcnFile?: string }> = {
  NAVBAR:         { file: 'Navbar.tsx',        component: 'Navbar',        shadcnFile: 'shadcn/Navbar.tsx' },
  HERO:           { file: 'Hero.tsx',           component: 'Hero',           shadcnFile: 'shadcn/Hero.tsx' },
  FEATURES:       { file: 'Features.tsx',       component: 'Features',       shadcnFile: 'shadcn/Features.tsx' },
  CTA:            { file: 'CTASection.tsx',     component: 'CTASection',     shadcnFile: 'shadcn/CTASection.tsx' },
  TESTIMONIALS:   { file: 'Testimonials.tsx',   component: 'Testimonials',   shadcnFile: 'shadcn/Testimonials.tsx' },
  PRICING:        { file: 'Pricing.tsx',        component: 'Pricing',        shadcnFile: 'shadcn/Pricing.tsx' },
  FAQ:            { file: 'FAQ.tsx',            component: 'FAQ',            shadcnFile: 'shadcn/FAQ.tsx' },
  STATS:          { file: 'Stats.tsx',          component: 'Stats' },
  TEAM:           { file: 'Team.tsx',           component: 'Team' },
  NEWSLETTER:     { file: 'Newsletter.tsx',     component: 'Newsletter',     shadcnFile: 'shadcn/Newsletter.tsx' },
  LOGO_CLOUD:     { file: 'LogoCloud.tsx',      component: 'LogoCloud' },
  SKILLS:         { file: 'Skills.tsx',         component: 'Skills',         shadcnFile: 'shadcn/Skills.tsx' },
  TIMELINE:       { file: 'Timeline.tsx',       component: 'Timeline' },
  PORTFOLIO_GRID: { file: 'PortfolioGrid.tsx',  component: 'PortfolioGrid',  shadcnFile: 'shadcn/PortfolioGrid.tsx' },
  CONTACT_FORM:   { file: 'ContactForm.tsx',    component: 'ContactForm',    shadcnFile: 'shadcn/ContactForm.tsx' },
  GALLERY:        { file: 'Gallery.tsx',        component: 'Gallery' },
  PRODUCT_GRID:   { file: 'ProductGrid.tsx',    component: 'ProductGrid',    shadcnFile: 'shadcn/ProductGrid.tsx' },
  TRUST_BADGES:   { file: 'TrustBadges.tsx',    component: 'TrustBadges' },
  COUNTDOWN:      { file: 'Countdown.tsx',      component: 'Countdown' },
  SCHEDULE:       { file: 'Schedule.tsx',       component: 'Schedule' },
  CASE_STUDY:     { file: 'CaseStudy.tsx',      component: 'CaseStudy' },
  VIDEO_EMBED:    { file: 'VideoEmbed.tsx',     component: 'VideoEmbed' },
};

export type ScaffoldConfig = {
  metadata: {
    siteName: string;
    themeMode?: string;
    fontFamily?: string;
    enableThemeToggle?: boolean;
    colors: { primary: string; secondary: string };
  };
  sections: Array<{ type: string; variant?: string; content: unknown }>;
};

export function toKebab(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'landing-page';
}

// Rewrite './theme.js' imports to '../theme' for the sections/ subdirectory (plain variants)
function rewriteThemeImport(source: string): string {
  return source.replace(/from ['"]\.\/theme\.js['"]/g, "from '../theme'");
}

// Rewrite '../theme.js' imports to '../theme' for shadcn variants (one level deeper in source)
function rewriteThemeImportFromSubdir(source: string): string {
  return source.replace(/from ['"]\.\.\/theme\.js['"]/g, "from '../theme'");
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
export type UiLib    = 'tailwind' | 'shadcn';

// ---------------------------------------------------------------------------
// shadcn/ui extras
// ---------------------------------------------------------------------------

const SHADCN_CSS_VARS = `
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}
`;

const SHADCN_TAILWIND_THEME = `
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },`;

function writeShadcnExtras(
  projectDir: string,
  componentsDir: string,
  framework: Framework,
  projectName: string,
  usedTypes: string[],
): void {
  // lib/utils.ts
  const libDir = join(projectDir, 'src', 'lib');
  mkdirSync(libDir, { recursive: true });
  writeFileSync(join(libDir, 'utils.ts'), `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`);

  // components/ui/ primitives — always at src/components/ui/ regardless of framework
  const uiDir = join(projectDir, 'src', 'components', 'ui');
  mkdirSync(uiDir, { recursive: true });

  writeFileSync(join(uiDir, 'button.tsx'), `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        {
          default:     'bg-primary text-primary-foreground shadow hover:bg-primary/90',
          outline:     'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
          ghost:       'hover:bg-accent hover:text-accent-foreground',
          link:        'text-primary underline-offset-4 hover:underline',
          destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        }[variant],
        { default: 'h-9 px-4 py-2', sm: 'h-8 rounded-md px-3 text-xs', lg: 'h-10 rounded-md px-8', icon: 'h-9 w-9' }[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
export { Button };
`);

  writeFileSync(join(uiDir, 'card.tsx'), `import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-xl border bg-card text-card-foreground shadow', className)} {...props} />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
`);

  writeFileSync(join(uiDir, 'badge.tsx'), `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          default:     'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
          secondary:   'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
          outline:     'text-foreground',
          destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}
export { Badge };
`);

  // Additional UI primitives — no Radix deps, pure HTML + Tailwind
  writeFileSync(join(uiDir, 'input.tsx'), `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
export { Input };
`);

  writeFileSync(join(uiDir, 'label.tsx'), `import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  ),
);
Label.displayName = 'Label';
export { Label };
`);

  writeFileSync(join(uiDir, 'textarea.tsx'), `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
export { Textarea };
`);

  writeFileSync(join(uiDir, 'separator.tsx'), `import * as React from 'react';
import { cn } from '@/lib/utils';

const Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      role="none"
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';
export { Separator };
`);

  // Radix-based components — only written when the matching section is used
  if (usedTypes.includes('FAQ')) writeFileSync(join(uiDir, 'accordion.tsx'), `import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('border-b', className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
`);

  if (usedTypes.includes('NAVBAR')) writeFileSync(join(uiDir, 'sheet.tsx'), `import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-y-0 right-0 z-50 h-full w-3/4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

export { Sheet, SheetClose, SheetContent, SheetTrigger };
`);

  // components.json
  const cssPath = framework === 'nextjs' ? 'src/app/globals.css' : 'src/index.css';
  writeFileSync(join(projectDir, 'components.json'), JSON.stringify({
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'new-york',
    rsc: false,
    tsx: true,
    tailwind: { config: 'tailwind.config.js', css: cssPath, baseColor: 'zinc', cssVariables: true },
    aliases: { components: '@/components', utils: '@/lib/utils' },
  }, null, 2));

  // Overwrite tailwind.config.js with shadcn-extended version
  const content = framework === 'nextjs' ? `'./src/**/*.{js,ts,jsx,tsx,mdx}'` : `'./index.html', './src/**/*.{ts,tsx}'`;
  const exportStyle = framework === 'nextjs' ? 'module.exports =' : 'export default';
  writeFileSync(join(projectDir, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
${exportStyle} {
  darkMode: ['class'],
  content: [${content}],
  theme: {
    extend: {${SHADCN_TAILWIND_THEME}
    },
  },
  plugins: [require('tailwindcss-animate')],
};
`);

  // Append shadcn CSS variables to the CSS entry file
  const cssFile = framework === 'nextjs'
    ? join(projectDir, 'src', 'app', 'globals.css')
    : join(projectDir, 'src', 'index.css');
  const existing = readFileSync(cssFile, 'utf-8');
  writeFileSync(cssFile, existing + SHADCN_CSS_VARS);
}


function generateHomeTsx(
  config: ScaffoldConfig,
  usedTypes: string[],
  heroImageUrl?: string,
  framework: Framework = 'vite'
): string {
  const { colors, themeMode = 'light', fontFamily = 'sans', enableThemeToggle = false } = config.metadata;

  const imports = usedTypes
    .map((t) => {
      const info = SECTION_MAP[t];
      return `import { ${info.component} } from './sections/${info.file.replace('.tsx', '')}';`;
    })
    .join('\n');

  const fontClass = FONT_CLASS[fontFamily] ?? FONT_CLASS['sans'];
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

  if (enableThemeToggle) {
    return `${directive}import React, { useState } from 'react';
import type { Theme } from './theme';
${imports}

type ThemeMode = 'light' | 'dark' | 'midnight';

const THEME_CLASSES: Record<ThemeMode, string> = {
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 text-gray-100',
  midnight: 'bg-slate-950 text-white',
};

const THEME_CYCLE: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'midnight',
  midnight: 'light',
};

const THEME_ICONS: Record<ThemeMode, string> = {
  light: '☀️',
  dark: '🌙',
  midnight: '✦',
};

export function Home() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('${themeMode}');
  const theme: Theme = {
    colors: { primary: '${colors.primary}', secondary: '${colors.secondary}' },
    themeMode,
    fontFamily: '${fontFamily}',
  };
  return (
    <main
      className={"min-h-screen ${fontClass} " + THEME_CLASSES[themeMode]}
      style={{ '--color-primary': '${colors.primary}', '--color-secondary': '${colors.secondary}' } as React.CSSProperties}
    >
${sectionJsx}
      <button
        onClick={() => setThemeMode(THEME_CYCLE[themeMode])}
        aria-label="Toggle theme"
        className={"fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 " + (themeMode === 'light' ? 'bg-gray-900 text-white' : 'bg-white/10 text-white backdrop-blur-md border border-white/20')}
      >
        <span>{THEME_ICONS[themeMode]}</span>
        <span className="capitalize">{themeMode}</span>
      </button>
    </main>
  );
}
`;
  }

  const bgClass = THEME_BG[themeMode] ?? THEME_BG['light'];
  return `${directive}import React from 'react';
import type { Theme } from './theme';
${imports}

const theme: Theme = {
  colors: { primary: '${colors.primary}', secondary: '${colors.secondary}' },
  themeMode: '${themeMode}',
  fontFamily: '${fontFamily}',
};

export function Home() {
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
  framework: Framework = 'vite',
  uiLib: UiLib = 'tailwind',
  projectNameOverride?: string
): string {
  const templatesDir = getTemplatesDir(workspaceRoot);
  const projectName  = projectNameOverride ?? toKebab(config.metadata.siteName);
  const projectDir   = join(outputDir, projectName);

  if (existsSync(projectDir)) {
    throw new Error(`ERR_DIR_EXISTS:${projectDir}`);
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

  // Section components — use shadcn variant when available, otherwise plain
  for (const type of usedTypes) {
    const info = SECTION_MAP[type];
    const isShadcn = uiLib === 'shadcn' && !!info.shadcnFile;
    const templatePath = isShadcn ? info.shadcnFile! : info.file;
    const src = readFileSync(join(templatesDir, templatePath), 'utf-8');
    const rewritten = isShadcn ? rewriteThemeImportFromSubdir(src) : rewriteThemeImport(src);
    writeFileSync(join(componentsDir, 'sections', info.file), rewritten);
  }

  // Home.tsx
  writeFileSync(
    join(componentsDir, 'Home.tsx'),
    generateHomeTsx(config, usedTypes, heroImageUrl, framework)
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
  description: 'Generated by siteblaze',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`);

    writeFileSync(join(projectDir, 'src', 'app', 'page.tsx'), `import { Home } from '../components/Home';

export default function Page() {
  return <Home />;
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
        lint: 'eslint .',
      },
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        ...(uiLib === 'shadcn' ? {
          clsx: '^2.1.0',
          'tailwind-merge': '^2.3.0',
          'lucide-react': '^0.400.0',
          ...(usedTypes.includes('FAQ')    ? { '@radix-ui/react-accordion': '^1.2.0' } : {}),
          ...(usedTypes.includes('NAVBAR') ? { '@radix-ui/react-dialog':    '^1.1.0' } : {}),
        } : {}),
      },
      devDependencies: {
        typescript: '^5.4.0',
        '@types/node': '^20.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
        eslint: '^9.0.0',
        'eslint-config-next': '^15.0.0',
        '@eslint/eslintrc': '^3.0.0',
        ...(uiLib === 'shadcn' ? { 'tailwindcss-animate': '^1.0.7' } : {}),
      },
    }, null, 2));

    writeFileSync(join(projectDir, 'eslint.config.mjs'), `import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default eslintConfig;
`);

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
import { Home } from './Home';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Home />
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
        lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        ...(uiLib === 'shadcn' ? {
          clsx: '^2.1.0',
          'tailwind-merge': '^2.3.0',
          'lucide-react': '^0.400.0',
          ...(usedTypes.includes('FAQ')    ? { '@radix-ui/react-accordion': '^1.2.0' } : {}),
          ...(usedTypes.includes('NAVBAR') ? { '@radix-ui/react-dialog':    '^1.1.0' } : {}),
        } : {}),
      },
      devDependencies: {
        typescript: '^5.4.0',
        vite: '^6.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
        eslint: '^9.9.0',
        '@eslint/js': '^9.9.0',
        globals: '^15.9.0',
        'typescript-eslint': '^8.0.1',
        'eslint-plugin-react-hooks': '^5.1.0',
        'eslint-plugin-react-refresh': '^0.4.9',
        ...(uiLib === 'shadcn' ? { 'tailwindcss-animate': '^1.0.7' } : {}),
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
      },
    }, null, 2));

    writeFileSync(join(projectDir, 'eslint.config.js'), `import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
`);

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
        ...(uiLib === 'shadcn' ? { baseUrl: '.', paths: { '@/*': ['./src/*'] } } : {}),
      },
      include: ['src'],
    }, null, 2));

    writeFileSync(join(projectDir, 'vite.config.ts'), uiLib === 'shadcn'
      ? `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
`
      : `import { defineConfig } from 'vite';
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

  const editPath = framework === 'nextjs' ? 'src/components/Home.tsx' : 'src/Home.tsx';
  const sectionList = usedTypes.map(t => `- ${t}`).join('\n');
  writeFileSync(join(projectDir, 'README.md'), `# ${config.metadata.siteName}

## Get started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Project structure

- \`${editPath}\` — page layout, controls which sections appear
- \`src/${framework === 'nextjs' ? 'components/' : ''}sections/\` — individual section components
- \`src/theme.ts\` — colors, fonts, and theme mode

## Sections (${usedTypes.length})

${sectionList}

## Customise

Open \`${editPath}\` to rearrange, add, or remove sections.
Each section accepts \`content\`, \`variant\`, and \`theme\` props.
`);

  if (uiLib === 'shadcn') {
    writeShadcnExtras(projectDir, componentsDir, framework, projectName, usedTypes);
  }

  return projectDir;
}

/**
 * Overwrites src/Home.tsx with a new version that includes the hero
 * image URL. Called after the image has been downloaded and placed in
 * public/images/hero.jpg.
 */
export function rewriteHome(
  projectDir: string,
  config: ScaffoldConfig,
  heroImageUrl: string,
  framework: Framework = 'vite',
  _uiLib: UiLib = 'tailwind'
): void {
  const usedTypes = [...new Set(config.sections.map((s) => s.type))].filter(
    (t) => t in SECTION_MAP
  );
  const componentsDir = framework === 'nextjs'
    ? join(projectDir, 'src', 'components')
    : join(projectDir, 'src');
  writeFileSync(
    join(componentsDir, 'Home.tsx'),
    generateHomeTsx(config, usedTypes, heroImageUrl, framework)
  );
}
