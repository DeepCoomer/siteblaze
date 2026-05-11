import { useEffect, useRef, useState } from 'react';
import { PageRenderer } from '@org/engine-core';

// Dev: separate Vite + API servers on different ports → absolute URL needed
// Production (bundled): served from the same Express server → relative URL works
const API_URL = import.meta.env.DEV ? 'http://localhost:3000/config' : '/config';

type ThemeMode = 'light' | 'dark' | 'midnight';
const THEMES: ThemeMode[] = ['light', 'dark', 'midnight'];
const THEME_ICON: Record<ThemeMode, string> = { light: '☀️', dark: '🌙', midnight: '✦' };
const STORAGE_KEY = 'landing-engine:theme';

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; config: unknown; defaultTheme: ThemeMode; enableThemeToggle: boolean };

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync textarea when drawer opens
  useEffect(() => {
    if (open) {
      setText(JSON.stringify(config, null, 2));
      setParseError(null);
      setSaveState('idle');
      setTimeout(() => textareaRef.current?.focus(), 50);
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

  function handleApply() {
    try {
      const parsed = JSON.parse(text);
      onApply(parsed);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }

  async function handleSave() {
    try {
      const parsed = JSON.parse(text);
      setSaveState('saving');
      const res = await fetch(API_URL.replace('/config', '/config'), {
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

  function handleDownload() {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'config.json';
    a.click();
  }

  const canApply = !parseError && text.trim() !== '';

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
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold">config.json</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-gray-400 hover:text-white"
            aria-label="Close editor"
          >
            ✕
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 resize-none bg-transparent p-5 font-mono text-xs text-gray-200 outline-none"
          spellCheck={false}
        />

        {parseError && (
          <p className="border-t border-red-900/50 bg-red-950/50 px-5 py-2 text-xs text-red-400">
            {parseError}
          </p>
        )}

        <div className="flex gap-2 border-t border-white/10 p-4">
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={!canApply || saveState === 'saving'}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save to file'}
          </button>
          <button
            onClick={handleDownload}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            title="Download config.json"
          >
            ↓
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

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error ?? res.statusText));
        return res.json();
      })
      .then((config) => {
        if (cancelled) return;
        const meta = (config as { metadata?: { themeMode?: string; enableThemeToggle?: boolean } })?.metadata;
        const defaultTheme = meta?.themeMode as ThemeMode ?? 'light';
        const enableThemeToggle = meta?.enableThemeToggle ?? false;
        setState({ status: 'ok', config, defaultTheme, enableThemeToggle });
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
            <code className="font-mono rounded bg-gray-100 px-1 py-0.5">landing-engine preview</code>
          </p>
        </div>
      </div>
    );
  }

  const effectiveConfig = liveConfig ?? state.config;
  const effectiveTheme  = themeOverride ?? state.defaultTheme;

  return (
    <>
      <PageRenderer config={effectiveConfig} themeOverride={effectiveTheme} />
      {state.enableThemeToggle && <ThemeToggle current={effectiveTheme} onCycle={cycleTheme} />}
      <ConfigEditor config={effectiveConfig} onApply={setLiveConfig} />
    </>
  );
}

export default App;
