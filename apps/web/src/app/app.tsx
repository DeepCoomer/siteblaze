import { useEffect, useRef, useState } from 'react';
import { PageRenderer } from '@org/engine-core';

// Dev: separate Vite + API servers on different ports → absolute URL needed
// Production (bundled): served from the same Express server → relative URL works
const API_URL = import.meta.env.DEV ? 'http://localhost:3000/config' : '/config';

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
        fixed bottom-6 right-6 z-50
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
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Patch a metadata field and update the JSON textarea
  function patchMeta(updater: (meta: Record<string, unknown>) => void) {
    try {
      const parsed = JSON.parse(text) as { metadata?: Record<string, unknown> };
      if (!parsed.metadata) parsed.metadata = {};
      updater(parsed.metadata);
      const updated = JSON.stringify(parsed, null, 2);
      setText(updated);
      setParseError(null);
    } catch {
      /* JSON currently invalid — quick settings are read-only */
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
  const canSave = !parseError && text.trim() !== '';

  const inputCls = 'w-full rounded bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors';
  const selectCls = 'w-full rounded bg-gray-800 border border-white/10 px-2 py-1.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer';
  const labelCls = 'block text-xs text-gray-400 mb-1';

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open config editor"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-gray-900/80 px-4 py-2 text-sm font-medium text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <span className="font-mono text-xs">{'{}'}</span>
        <span>Edit config</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-full max-w-xl flex-col bg-gray-950 text-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold">Edit site</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-gray-400 hover:text-white"
            aria-label="Close editor"
          >
            ✕
          </button>
        </div>

        {/* Quick settings */}
        <div className="border-b border-white/10 px-5 py-4 space-y-3 shrink-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Site settings</p>

          {/* Site name */}
          <div>
            <label className={labelCls}>Site name</label>
            <input
              type="text"
              value={quickMeta?.siteName ?? ''}
              disabled={!quickMeta}
              onChange={(e) => patchMeta((m) => { m['siteName'] = e.target.value; })}
              className={inputCls + ' disabled:opacity-40'}
              placeholder="My Awesome Site"
            />
          </div>

          {/* Theme + Font + Toggle row */}
          <div className="flex gap-3">
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
                className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${
                  quickMeta?.enableThemeToggle ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={quickMeta?.enableThemeToggle ?? false}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    quickMeta?.enableThemeToggle ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Colors row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Primary color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={quickMeta?.primaryColor ?? '#6366f1'}
                  disabled={!quickMeta}
                  onChange={(e) => patchMeta((m) => {
                    if (!m['colors']) m['colors'] = {};
                    (m['colors'] as Record<string, string>)['primary'] = e.target.value;
                  })}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent p-0.5 disabled:opacity-40"
                />
                <input
                  type="text"
                  value={quickMeta?.primaryColor ?? '#6366f1'}
                  disabled={!quickMeta}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-f]{6}$/i.test(val)) {
                      patchMeta((m) => {
                        if (!m['colors']) m['colors'] = {};
                        (m['colors'] as Record<string, string>)['primary'] = val;
                      });
                    }
                  }}
                  maxLength={7}
                  className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 font-mono text-xs text-gray-300 outline-none focus:border-indigo-500 transition-colors disabled:opacity-40"
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className={labelCls}>Secondary color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={quickMeta?.secondaryColor ?? '#8b5cf6'}
                  disabled={!quickMeta}
                  onChange={(e) => patchMeta((m) => {
                    if (!m['colors']) m['colors'] = {};
                    (m['colors'] as Record<string, string>)['secondary'] = e.target.value;
                  })}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent p-0.5 disabled:opacity-40"
                />
                <input
                  type="text"
                  value={quickMeta?.secondaryColor ?? '#8b5cf6'}
                  disabled={!quickMeta}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-f]{6}$/i.test(val)) {
                      patchMeta((m) => {
                        if (!m['colors']) m['colors'] = {};
                        (m['colors'] as Record<string, string>)['secondary'] = val;
                      });
                    }
                  }}
                  maxLength={7}
                  className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 font-mono text-xs text-gray-300 outline-none focus:border-indigo-500 transition-colors disabled:opacity-40"
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Raw JSON — sections and advanced editing */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Raw JSON</p>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 resize-none bg-transparent px-5 pb-3 font-mono text-xs text-gray-200 outline-none min-h-0"
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
            title="Download as a ready-to-run React project"
          >
            {downloadState === 'loading' ? 'Zipping…' : downloadState === 'error' ? '✗ Failed' : '↓ Download Project'}
          </button>
          <button
            onClick={handleDownloadConfig}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            title="Download config.json only"
          >
            ↓ JSON
          </button>
        </div>
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
      {enableThemeToggle && <ThemeToggle current={effectiveTheme} onCycle={cycleTheme} />}
      <ConfigEditor config={effectiveConfig} onApply={handleApply} />
    </>
  );
}

export default App;
