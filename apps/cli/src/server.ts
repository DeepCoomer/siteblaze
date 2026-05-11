import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// When bundled: dist/index.js → __dirname = <pkg>/dist  → web dir = <pkg>/web
// When dev (tsx): src/server.ts → __dirname = <repo>/apps/cli/src → web dir = <repo>/apps/cli/web
export const WEB_DIR = join(__dirname, '..', 'web');

export function startServer(configPath: string, port = 3000): void {
  const app = express();
  app.use(express.json());

  // ── API ────────────────────────────────────────────────────────────────────

  app.get('/config', (req, res) => {
    if (!existsSync(configPath)) {
      res.status(404).json({ error: `config.json not found at ${configPath}` });
      return;
    }
    try {
      res.json(JSON.parse(readFileSync(configPath, 'utf-8')));
    } catch {
      res.status(500).json({ error: 'Failed to parse config.json — check for syntax errors.' });
    }
  });

  app.put('/config', (req, res) => {
    try {
      writeFileSync(configPath, JSON.stringify(req.body, null, 2));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // ── Static web app + SPA fallback ─────────────────────────────────────────

  app.use(express.static(WEB_DIR));

  app.get('*', (req, res) => {
    res.sendFile(join(WEB_DIR, 'index.html'));
  });

  // ── Listen ─────────────────────────────────────────────────────────────────

  const server = app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n  Preview  →  ${url}\n`);
    import('open')
      .then(({ default: open }) => open(url))
      .catch(() => { /* best-effort */ });
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${port} is already in use.`);
      console.error(`Is a preview already running? Open http://localhost:${port}\n`);
    } else {
      console.error(`\nServer error: ${err.message}\n`);
    }
    process.exit(1);
  });
}

/** True when the pre-built web app is present (published / bundled mode). */
export function isPublishedMode(): boolean {
  return existsSync(join(WEB_DIR, 'index.html'));
}
