import { useEffect, useRef, useState } from 'react';
import { PageRenderer } from '@org/engine-core';

// Dev: separate Vite + API servers on different ports → absolute URL needed
// Production (bundled): served from the same Express server → relative URL works
const API_URL  = import.meta.env.DEV ? 'http://localhost:3000/config' : '/config';
const FILL_URL = import.meta.env.DEV ? 'http://localhost:3000/fill-section' : '/fill-section';

type ThemeMode = 'light' | 'dark' | 'midnight';
const THEMES: ThemeMode[] = ['light', 'dark', 'midnight'];
const THEME_ICON: Record<ThemeMode, string> = { light: '☀️', dark: '🌙', midnight: '✦' };
const STORAGE_KEY = 'siteblaze:theme';

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; config: unknown; defaultTheme: ThemeMode };


type QuickMeta = {
  siteName: string;
  siteType: string;
  themeMode: string;
  fontFamily: string;
  enableThemeToggle: boolean;
  primaryColor: string;
  secondaryColor: string;
};

function extractQuickMeta(jsonText: string): QuickMeta | null {
  try {
    const p = JSON.parse(jsonText) as { metadata?: Record<string, unknown> };
    const m = p.metadata ?? {};
    const colors = (m['colors'] as Record<string, string>) ?? {};
    const primary = String(colors['primary'] ?? '#6366f1');
    const secondary = String(colors['secondary'] ?? '#8b5cf6');
    return {
      siteName: String(m['siteName'] ?? ''),
      siteType: String(m['siteType'] ?? 'landing'),
      themeMode: String(m['themeMode'] ?? 'light'),
      fontFamily: String(m['fontFamily'] ?? 'sans'),
      enableThemeToggle: Boolean(m['enableThemeToggle'] ?? false),
      primaryColor: /^#[0-9a-f]{6}$/i.test(primary) ? primary : '#6366f1',
      secondaryColor: /^#[0-9a-f]{6}$/i.test(secondary) ? secondary : '#8b5cf6',
    };
  } catch {
    return null;
  }
}

// Minimum valid content per section type (satisfies schema, renders immediately)
const SECTION_DEFAULTS: Record<string, Record<string, unknown>> = {
  NAVBAR:        { logo: 'Logo', links: [], ctaText: 'Get Started' },
  HERO:          { title: 'Your Headline', subtitle: 'Supporting subtitle goes here.', ctaText: 'Get Started' },
  FEATURES:      { title: 'Features', items: [{ icon: '✦', title: 'Feature', description: 'Describe the feature.' }] },
  TESTIMONIALS:  { title: 'What people say', items: [{ quote: 'Great product!', author: 'Name', role: 'Role' }] },
  PRICING:       { title: 'Pricing', tiers: [{ name: 'Basic', price: 'Free', features: ['Feature one'], ctaText: 'Get started' }] },
  CTA:           { title: 'Ready to get started?', buttonText: 'Get Started' },
  FAQ:           { title: 'FAQ', items: [{ question: 'Your question?', answer: 'Your answer.' }] },
  STATS:         { title: 'By the numbers', items: [{ value: '100+', label: 'Users' }] },
  TEAM:          { title: 'Our Team', items: [{ name: 'Name', role: 'Role' }] },
  NEWSLETTER:    { title: 'Stay in the loop', buttonText: 'Subscribe' },
  LOGO_CLOUD:    { title: 'Trusted by', items: [{ name: 'Company' }] },
  SKILLS:        { title: 'Skills', items: [{ name: 'Skill' }] },
  TIMELINE:      { title: 'Timeline', items: [{ year: '2024', title: 'Event', description: 'Description' }] },
  PORTFOLIO_GRID:{ title: 'Work', items: [{ title: 'Project', description: 'Description', tags: [] }] },
  CONTACT_FORM:  { title: 'Get in touch', buttonText: 'Send Message' },
  GALLERY:       { title: 'Gallery', items: [{ alt: 'Image' }] },
  PRODUCT_GRID:  { title: 'Products', items: [{ name: 'Product', price: '$0' }] },
  TRUST_BADGES:  { items: [{ icon: '✦', title: 'Trusted & Secure' }] },
  COUNTDOWN:     { title: 'Coming Soon', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  SCHEDULE:      { title: 'Schedule', items: [{ time: '9:00 AM', title: 'Session' }] },
  CASE_STUDY:    { title: 'Case Study' },
  VIDEO_EMBED:   {},
};

// Types that should only appear once per page
const SINGLETON_TYPES = new Set(['NAVBAR', 'HERO']);

const SECTION_VARIANTS: Record<string, string[]> = {
  NAVBAR:        ['sticky', 'transparent', 'minimal'],
  HERO:          ['centered', 'split-image', 'minimal'],
  FEATURES:      ['grid', 'list', 'cards'],
  TESTIMONIALS:  ['grid', 'carousel', 'minimal'],
  PRICING:       ['cards', 'table', 'minimal'],
  CTA:           ['centered', 'banner', 'minimal'],
  FAQ:           ['accordion', 'grid', 'minimal'],
  STATS:         ['grid', 'banner', 'minimal'],
  TEAM:          ['grid', 'cards', 'minimal'],
  NEWSLETTER:    ['centered', 'banner', 'minimal'],
  LOGO_CLOUD:    ['row', 'grid', 'minimal'],
  SKILLS:        ['badges', 'bars', 'grid'],
  TIMELINE:      ['vertical', 'horizontal', 'minimal'],
  PORTFOLIO_GRID:['grid', 'list', 'minimal'],
  CONTACT_FORM:  ['centered', 'split', 'minimal'],
  GALLERY:       ['grid', 'masonry', 'minimal'],
  PRODUCT_GRID:  ['grid', 'list', 'featured'],
  TRUST_BADGES:  ['row', 'grid', 'minimal'],
  COUNTDOWN:     ['centered', 'banner', 'minimal'],
  SCHEDULE:      ['timeline', 'grid', 'minimal'],
  CASE_STUDY:    ['split', 'stacked', 'minimal'],
  VIDEO_EMBED:   ['centered', 'split', 'minimal'],
};

function sectionLabel(type: string): string {
  return type.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ');
}

type SectionEntry = { type: string; variant: string };

function extractSections(jsonText: string): SectionEntry[] | null {
  try {
    const p = JSON.parse(jsonText) as { sections?: Array<{ type?: string; variant?: string }> };
    return p.sections?.map((s) => ({ type: String(s.type ?? ''), variant: String(s.variant ?? '') })) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

function ThemeToggle({ current, onCycle }: { current: ThemeMode; onCycle: () => void }) {
  const isLight = current === 'light';
  return (
    <button
      onClick={onCycle}
      aria-label={`Switch theme (current: ${current})`}
      className={`
        flex items-center gap-2 rounded-full px-4 py-2
        text-sm font-medium shadow-xl
        transition-all duration-300 hover:scale-105 active:scale-95
        ${isLight
          ? 'bg-gray-900 text-white'
          : 'bg-white/10 text-white backdrop-blur-md border border-white/20'}
      `}
    >
      <span className="text-base leading-none">{THEME_ICON[current]}</span>
      <span className="capitalize">{current}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Config editor drawer
// ---------------------------------------------------------------------------

function ConfigEditor({
  config,
  onApply,
}: {
  config: unknown;
  onApply: (next: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'json'>('settings');
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSaveLabel, setAutoSaveLabel] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ALL_SECTION_TYPES = Object.keys(SECTION_VARIANTS);
  const [newSectionType, setNewSectionType] = useState(ALL_SECTION_TYPES[0]);
  const [newSectionVariant, setNewSectionVariant] = useState(SECTION_VARIANTS[ALL_SECTION_TYPES[0]][0]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [fillingIndices, setFillingIndices] = useState<Set<number>>(new Set());
  const [fillErrorIndices, setFillErrorIndices] = useState<Set<number>>(new Set());
  const [deletedCache, setDeletedCache] = useState<Map<string, Array<{ variant: string; content: Record<string, unknown> }>>>(new Map());
  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);

  useEffect(() => {
    if (open) {
      setText(JSON.stringify(config, null, 2));
      setParseError(null);
      setSaveState('idle');
    }
  }, [open, config]);

  function handleChange(val: string) {
    setText(val);
    try {
      JSON.parse(val);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }

  async function autoSave(jsonText: string) {
    try {
      const parsed = JSON.parse(jsonText);
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      onApply(parsed);
      setAutoSaveLabel(true);
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => setAutoSaveLabel(false), 1500);
    } catch {
      /* silent — server may not be ready yet */
    }
  }

  function patchMeta(updater: (meta: Record<string, unknown>) => void) {
    try {
      const parsed = JSON.parse(text) as { metadata?: Record<string, unknown> };
      if (!parsed.metadata) parsed.metadata = {};
      updater(parsed.metadata);
      const updated = JSON.stringify(parsed, null, 2);
      setText(updated);
      setParseError(null);
      autoSave(updated);
    } catch {
      /* JSON currently invalid */
    }
  }

  function patchSection(index: number, variant: string) {
    try {
      const parsed = JSON.parse(text) as { sections?: Array<Record<string, unknown>> };
      if (!parsed.sections?.[index]) return;
      parsed.sections[index]['variant'] = variant;
      const updated = JSON.stringify(parsed, null, 2);
      setText(updated);
      setParseError(null);
      autoSave(updated);
    } catch {
      /* JSON currently invalid */
    }
  }

  function deleteSection(index: number) {
    try {
      const parsed = JSON.parse(text) as { sections?: Array<Record<string, unknown>> };
      if (!parsed.sections) return;
      const removed = parsed.sections[index];
      if (removed) {
        const type = String(removed['type'] ?? '');
        const variant = String(removed['variant'] ?? '');
        const content = (removed['content'] ?? {}) as Record<string, unknown>;
        setDeletedCache((prev) => {
          const next = new Map(prev);
          next.set(type, [...(next.get(type) ?? []), { variant, content }]);
          return next;
        });
      }
      parsed.sections.splice(index, 1);
      const updated = JSON.stringify(parsed, null, 2);
      setText(updated);
      setParseError(null);
      autoSave(updated);
    } catch {
      /* JSON currently invalid */
    }
  }

  async function triggerFill(index: number, sectionType: string, sectionVariant: string) {
    setFillingIndices((prev) => new Set([...prev, index]));
    setFillErrorIndices((prev) => { const n = new Set(prev); n.delete(index); return n; });
    try {
      const res = await fetch(FILL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionType, sectionVariant }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Fill failed');
      }
      const { content } = (await res.json()) as { content: Record<string, unknown> };
      // Apply to the current text (may have changed since append)
      const current = textRef.current;
      const parsed = JSON.parse(current) as { sections?: Array<Record<string, unknown>> };
      if (parsed.sections?.[index]) {
        parsed.sections[index]['content'] = content;
        const updated = JSON.stringify(parsed, null, 2);
        setText(updated);
        autoSave(updated);
      }
    } catch {
      setFillErrorIndices((prev) => new Set([...prev, index]));
    } finally {
      setFillingIndices((prev) => { const n = new Set(prev); n.delete(index); return n; });
    }
  }

  function appendSection(sectionType: string, sectionVariant: string) {
    try {
      const parsed = JSON.parse(text) as { sections?: Array<unknown> };
      if (!parsed.sections) parsed.sections = [];
      const newIndex = parsed.sections.length;

      const cachedStack = deletedCache.get(sectionType);
      const cached = cachedStack?.length ? cachedStack[cachedStack.length - 1] : null;

      if (cached) {
        setDeletedCache((prev) => {
          const next = new Map(prev);
          const stack = (next.get(sectionType) ?? []).slice(0, -1);
          if (stack.length === 0) next.delete(sectionType);
          else next.set(sectionType, stack);
          return next;
        });
        parsed.sections.push({ type: sectionType, variant: sectionVariant, content: cached.content });
      } else {
        parsed.sections.push({ type: sectionType, variant: sectionVariant, content: SECTION_DEFAULTS[sectionType] ?? {} });
      }

      const updated = JSON.stringify(parsed, null, 2);
      setText(updated);
      setParseError(null);
      autoSave(updated);
      if (!cached) triggerFill(newIndex, sectionType, sectionVariant);
    } catch {
      /* JSON currently invalid */
    }
  }

  function reorderSections(from: number, to: number) {
    if (from === to) return;
    try {
      const parsed = JSON.parse(text) as { sections?: Array<unknown> };
      if (!parsed.sections) return;
      const arr = [...parsed.sections];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      parsed.sections = arr;
      const updated = JSON.stringify(parsed, null, 2);
      setText(updated);
      setParseError(null);
      autoSave(updated);
    } catch {
      /* JSON currently invalid */
    }
  }

  async function handleSave() {
    try {
      const parsed = JSON.parse(text);
      setSaveState('saving');
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) throw new Error(await res.text());
      onApply(parsed);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (e) {
      setSaveState('error');
      setParseError((e as Error).message);
    }
  }

  function handleDownloadConfig() {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'config.json';
    a.click();
  }

  async function handleDownloadProject() {
    setDownloadState('loading');
    try {
      if (!parseError && text.trim()) {
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: text,
        });
      }
      const res = await fetch(API_URL.replace('/config', '/download'));
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? 'siteblaze-project.zip';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setDownloadState('idle');
    } catch {
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 3000);
    }
  }

  const quickMeta = parseError ? null : extractQuickMeta(text);
  const sections = parseError ? null : extractSections(text);
  const canSave = !parseError && text.trim() !== '';

  const inputCls = 'w-full rounded bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors';
  const selectCls = 'w-full rounded bg-gray-800 border border-white/10 px-2 py-1.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer';
  const labelCls = 'block text-xs text-gray-400 mb-1';
  const sectionSelectCls = 'rounded bg-gray-800 border border-white/10 px-2 py-1 text-xs text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer';

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open config editor"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-gray-900/80 px-4 py-2 text-sm font-medium text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <span className="font-mono text-xs">{'{}'}</span>
        <span>Edit site</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-full max-w-xl flex-col bg-gray-950 text-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header: tabs + auto-save indicator + close */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
          <div className="flex gap-1">
            {(['settings', 'json'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {autoSaveLabel && activeTab === 'settings' && (
              <span className="text-xs text-emerald-400 transition-opacity">✓ Saved</span>
            )}
            <button onClick={() => setOpen(false)} className="rounded p-1 text-gray-400 hover:text-white" aria-label="Close editor">✕</button>
          </div>
        </div>

        {/* ── Settings tab ── */}
        {activeTab === 'settings' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Site */}
              <section>
                <p className={labelCls + ' uppercase tracking-wider mb-2'}>Site</p>
                <div>
                  <label className={labelCls}>Name</label>
                  <input
                    type="text"
                    value={quickMeta?.siteName ?? ''}
                    disabled={!quickMeta}
                    onChange={(e) => patchMeta((m) => { m['siteName'] = e.target.value; })}
                    className={inputCls + ' disabled:opacity-40 w-full'}
                    placeholder="My Awesome Site"
                  />
                </div>
              </section>

              {/* Appearance */}
              <section>
                <p className={labelCls + ' uppercase tracking-wider mb-2'}>Appearance</p>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className={labelCls}>Theme</label>
                    <select
                      value={quickMeta?.themeMode ?? 'light'}
                      disabled={!quickMeta}
                      onChange={(e) => patchMeta((m) => { m['themeMode'] = e.target.value; })}
                      className={selectCls + ' disabled:opacity-40'}
                    >
                      <option value="light">☀️  Light</option>
                      <option value="dark">🌙  Dark</option>
                      <option value="midnight">✦  Midnight</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={labelCls}>Font</label>
                    <select
                      value={quickMeta?.fontFamily ?? 'sans'}
                      disabled={!quickMeta}
                      onChange={(e) => patchMeta((m) => { m['fontFamily'] = e.target.value; })}
                      className={selectCls + ' disabled:opacity-40'}
                    >
                      <option value="sans">Sans-serif</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 pt-0.5">
                    <label className={labelCls + ' whitespace-nowrap'}>Theme toggle</label>
                    <button
                      disabled={!quickMeta}
                      onClick={() => quickMeta && patchMeta((m) => { m['enableThemeToggle'] = !quickMeta.enableThemeToggle; })}
                      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${quickMeta?.enableThemeToggle ? 'bg-indigo-600' : 'bg-gray-700'}`}
                      role="switch"
                      aria-checked={quickMeta?.enableThemeToggle ?? false}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${quickMeta?.enableThemeToggle ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  {(['primary', 'secondary'] as const).map((key) => {
                    const val = key === 'primary' ? (quickMeta?.primaryColor ?? '#6366f1') : (quickMeta?.secondaryColor ?? '#8b5cf6');
                    const placeholder = key === 'primary' ? '#6366f1' : '#8b5cf6';
                    return (
                      <div key={key} className="flex-1">
                        <label className={labelCls}>{key === 'primary' ? 'Primary' : 'Secondary'} color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={val}
                            disabled={!quickMeta}
                            onChange={(e) => patchMeta((m) => {
                              if (!m['colors']) m['colors'] = {};
                              (m['colors'] as Record<string, string>)[key] = e.target.value;
                            })}
                            className="h-8 w-10 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent p-0.5 disabled:opacity-40"
                          />
                          <input
                            type="text"
                            value={val}
                            disabled={!quickMeta}
                            onChange={(e) => {
                              if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
                                patchMeta((m) => {
                                  if (!m['colors']) m['colors'] = {};
                                  (m['colors'] as Record<string, string>)[key] = e.target.value;
                                });
                              }
                            }}
                            maxLength={7}
                            className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 font-mono text-xs text-gray-300 outline-none focus:border-indigo-500 transition-colors disabled:opacity-40"
                            placeholder={placeholder}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Sections */}
              <section>
                <p className={labelCls + ' uppercase tracking-wider mb-2'}>Sections</p>
                {sections && sections.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {sections.map((s, i) => {
                      const opts = SECTION_VARIANTS[s.type] ?? [];
                      const isDragging = dragIndex === i;
                      const isOver = dragOverIndex === i && dragIndex !== i;
                      const isFilling = fillingIndices.has(i);
                      const hasError = fillErrorIndices.has(i);
                      return (
                        <div
                          key={i}
                          draggable={!isFilling}
                          onDragStart={() => setDragIndex(i)}
                          onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                          onDrop={() => { reorderSections(dragIndex!, i); setDragIndex(null); setDragOverIndex(null); }}
                          onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                          className={`flex items-center gap-2 rounded px-1 py-0.5 transition-all ${
                            isDragging ? 'opacity-40' : 'opacity-100'
                          } ${isOver ? 'ring-1 ring-indigo-500 bg-white/5' : ''}`}
                        >
                          <span className="shrink-0 cursor-grab text-gray-600 hover:text-gray-400 select-none px-0.5">⠿</span>
                          <span className="w-24 shrink-0 text-xs text-gray-300 truncate">{sectionLabel(s.type)}</span>
                          {opts.length > 0 ? (
                            <select
                              value={s.variant}
                              disabled={isFilling}
                              onChange={(e) => patchSection(i, e.target.value)}
                              className={sectionSelectCls + ' flex-1 disabled:opacity-40'}
                            >
                              {opts.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                          ) : (
                            <span className="flex-1 text-xs text-gray-500 italic">no variants</span>
                          )}
                          {isFilling ? (
                            <span className="shrink-0 text-xs text-indigo-400 animate-pulse whitespace-nowrap">✦ AI writing…</span>
                          ) : hasError ? (
                            <button
                              onClick={() => triggerFill(i, s.type, s.variant)}
                              className="shrink-0 text-xs text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
                              title="AI fill failed — click to retry"
                            >⚠ Retry</button>
                          ) : (
                            <button
                              onClick={() => triggerFill(i, s.type, s.variant)}
                              className="shrink-0 text-gray-600 hover:text-indigo-400 transition-colors text-sm leading-none"
                              title="Regenerate content with AI"
                            >↻</button>
                          )}
                          <button
                            onClick={() => deleteSection(i)}
                            disabled={isFilling}
                            className="shrink-0 w-6 text-center text-gray-500 hover:text-red-400 transition-colors text-base leading-none disabled:opacity-30"
                            aria-label={`Remove ${s.type}`}
                          >×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Add section row — singletons already on page are hidden */}
                {(() => {
                  const existingTypes = new Set(sections?.map((s) => s.type) ?? []);
                  const available = ALL_SECTION_TYPES.filter((t) => !SINGLETON_TYPES.has(t) || !existingTypes.has(t));
                  const safeType = available.includes(newSectionType) ? newSectionType : (available[0] ?? newSectionType);
                  const safeVariant = SECTION_VARIANTS[safeType]?.includes(newSectionVariant) ? newSectionVariant : (SECTION_VARIANTS[safeType]?.[0] ?? '');
                  return (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <select
                        value={safeType}
                        onChange={(e) => { setNewSectionType(e.target.value); setNewSectionVariant(SECTION_VARIANTS[e.target.value]?.[0] ?? ''); }}
                        className={sectionSelectCls + ' flex-1'}
                      >
                        {available.map((t) => <option key={t} value={t}>{sectionLabel(t)}</option>)}
                      </select>
                      <select
                        value={safeVariant}
                        onChange={(e) => setNewSectionVariant(e.target.value)}
                        className={sectionSelectCls + ' w-24'}
                      >
                        {(SECTION_VARIANTS[safeType] ?? []).map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <button
                        onClick={() => appendSection(safeType, safeVariant)}
                        disabled={!!parseError}
                        className="shrink-0 rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                      >+ Add</button>
                    </div>
                  );
                })()}
              </section>

            </div>

            {/* Sticky download footer */}
            <div className="shrink-0 border-t border-white/10 p-4">
              <button
                onClick={handleDownloadProject}
                disabled={downloadState === 'loading'}
                className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {downloadState === 'loading' ? 'Zipping…' : downloadState === 'error' ? '✗ Failed' : '↓ Download Project'}
              </button>
            </div>
          </div>
        )}

        {/* ── JSON tab ── */}
        {activeTab === 'json' && (
          <>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 resize-none bg-transparent px-5 py-3 font-mono text-xs text-gray-200 outline-none min-h-0"
              spellCheck={false}
            />
            {parseError && (
              <p className="border-t border-red-900/50 bg-red-950/50 px-5 py-2 text-xs text-red-400 shrink-0">
                {parseError}
              </p>
            )}
            <div className="flex gap-2 border-t border-white/10 p-4 shrink-0">
              <button
                onClick={handleSave}
                disabled={!canSave || saveState === 'saving'}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save'}
              </button>
              <button
                onClick={handleDownloadProject}
                disabled={downloadState === 'loading'}
                className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {downloadState === 'loading' ? 'Zipping…' : downloadState === 'error' ? '✗ Failed' : '↓ Download Project'}
              </button>
              <button
                onClick={handleDownloadConfig}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                title="Download config.json only"
              >↓ JSON</button>
            </div>
          </>
        )}
      </aside>

    </>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const [state, setState] = useState<FetchState>({ status: 'loading' });
  const [liveConfig, setLiveConfig] = useState<unknown>(null);
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'error'>('idle');

  async function handleDownloadProject() {
    setDownloadState('loading');
    try {
      const downloadUrl = import.meta.env.DEV ? 'http://localhost:3000/download' : '/download';
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(res.statusText);
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
      const filename = match?.[2]?.trim() ?? 'project.zip';
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setDownloadState('idle');
    } catch {
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 3000);
    }
  }

  const [themeOverride, setThemeOverride] = useState<ThemeMode | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      return THEMES.includes(saved as ThemeMode) ? saved : null;
    } catch {
      return null;
    }
  });

  // Sync document.title to site name whenever config changes
  useEffect(() => {
    if (state.status !== 'ok') return;
    const cfg = liveConfig ?? state.config;
    const siteName = (cfg as { metadata?: { siteName?: string } })?.metadata?.siteName;
    if (siteName) document.title = siteName;
  }, [state, liveConfig]);

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error ?? res.statusText));
        return res.json();
      })
      .then((config) => {
        if (cancelled) return;
        const meta = (config as { metadata?: { themeMode?: string } })?.metadata;
        const defaultTheme = meta?.themeMode as ThemeMode ?? 'light';
        setState({ status: 'ok', config, defaultTheme });
        // Clear stale theme-toggle override from a previous session so the
        // config's theme is authoritative on every fresh page load.
        setThemeOverride(null);
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: String(err) });
      });
    return () => { cancelled = true; };
  }, []);

  function cycleTheme() {
    const base = state.status === 'ok' ? state.defaultTheme : 'light';
    const current = themeOverride ?? base;
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    setThemeOverride(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400 text-sm">
        Loading config…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
          <p className="font-semibold">Could not load configuration</p>
          <p className="mt-2 text-xs opacity-75">{state.message}</p>
          <p className="mt-4 text-xs text-gray-500">
            Start the full stack with{' '}
            <code className="font-mono rounded bg-gray-100 px-1 py-0.5">siteblaze preview</code>
          </p>
        </div>
      </div>
    );
  }

  const effectiveConfig = liveConfig ?? state.config;
  const configThemeMeta = (effectiveConfig as { metadata?: { themeMode?: string } })?.metadata?.themeMode;
  const configTheme = (THEMES.includes(configThemeMeta as ThemeMode) ? configThemeMeta : state.defaultTheme) as ThemeMode;
  const effectiveTheme = themeOverride ?? configTheme;
  const enableThemeToggle = (effectiveConfig as { metadata?: { enableThemeToggle?: boolean } })?.metadata?.enableThemeToggle ?? false;

  function handleApply(next: unknown) {
    // When user saves, let the config's theme take over — clear any manual override
    const savedTheme = (next as { metadata?: { themeMode?: string } })?.metadata?.themeMode as ThemeMode;
    if (savedTheme && THEMES.includes(savedTheme)) {
      setThemeOverride(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
    setLiveConfig(next);
  }

  return (
    <>
      <PageRenderer config={effectiveConfig} themeOverride={effectiveTheme} />
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <div className="group relative">
          <button
            onClick={handleDownloadProject}
            disabled={downloadState === 'loading'}
            aria-label="Download Project"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-all hover:bg-violet-500 disabled:opacity-40"
          >
            {downloadState === 'loading' ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : downloadState === 'error' ? '✗' : '↓'}
          </button>
          <span className="pointer-events-none absolute bottom-12 right-0 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
            Download Project
          </span>
        </div>
        {enableThemeToggle && <ThemeToggle current={effectiveTheme} onCycle={cycleTheme} />}
      </div>
      <ConfigEditor config={effectiveConfig} onApply={handleApply} />
    </>
  );
}

export default App;
