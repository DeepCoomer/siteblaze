import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { createApp } from './server.js';
import { findWorkspaceRoot } from './preview.js';

const VALID_CONFIG = {
  metadata: {
    siteName: 'Server Test Site',
    siteType: 'saas',
    themeMode: 'dark',
    fontFamily: 'sans',
    enableThemeToggle: false,
    colors: { primary: '#6366f1', secondary: '#8b5cf6' },
  },
  sections: [
    { type: 'NAVBAR', variant: 'sticky',   content: { logo: 'Test', links: [] } },
    { type: 'HERO',   variant: 'centered', content: { title: 'Hi', subtitle: 'Sub', ctaText: 'Go' } },
    { type: 'CTA',    variant: 'centered', content: { title: 'Ready?', buttonText: 'Start' } },
  ],
};

let workspaceRoot: string;

beforeAll(() => {
  workspaceRoot = findWorkspaceRoot(
    new URL('.', import.meta.url).pathname,
    p => existsSync(p),
  );
});

describe('createApp', () => {
  let tmpDir: string;
  let configPath: string;
  let baseUrl: string;
  let server: ReturnType<typeof createServer>;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `siteblaze-srv-test-${randomBytes(4).toString('hex')}`);
    mkdirSync(tmpDir, { recursive: true });
    configPath = join(tmpDir, 'config.json');

    const app = createApp(configPath, workspaceRoot);
    server = createServer(app as Parameters<typeof createServer>[1]);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close(err => (err ? reject(err) : resolve()))
    );
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── GET /config ─────────────────────────────────────────────────────────

  describe('GET /config', () => {
    it('returns 404 when config file does not exist', async () => {
      const res = await fetch(`${baseUrl}/config`);
      expect(res.status).toBe(404);
      const body = await res.json() as { error: string };
      expect(body.error).toMatch(/not found/);
    });

    it('returns the parsed JSON when config exists', async () => {
      writeFileSync(configPath, JSON.stringify(VALID_CONFIG));
      const res = await fetch(`${baseUrl}/config`);
      expect(res.status).toBe(200);
      const body = await res.json() as typeof VALID_CONFIG;
      expect(body.metadata.siteName).toBe('Server Test Site');
      expect(body.sections).toHaveLength(3);
    });

    it('returns 500 when config contains invalid JSON', async () => {
      writeFileSync(configPath, '{ not valid json }');
      const res = await fetch(`${baseUrl}/config`);
      expect(res.status).toBe(500);
    });
  });

  // ── PUT /config ──────────────────────────────────────────────────────────

  describe('PUT /config', () => {
    it('writes the request body to disk and returns ok', async () => {
      const res = await fetch(`${baseUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_CONFIG),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { ok: boolean };
      expect(body.ok).toBe(true);

      const saved = JSON.parse(readFileSync(configPath, 'utf-8')) as typeof VALID_CONFIG;
      expect(saved.metadata.siteName).toBe('Server Test Site');
    });

    it('round-trips a config through PUT then GET', async () => {
      await fetch(`${baseUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_CONFIG),
      });
      const res = await fetch(`${baseUrl}/config`);
      const body = await res.json() as typeof VALID_CONFIG;
      expect(body.metadata.colors.primary).toBe('#6366f1');
    });
  });

  // ── GET /download ────────────────────────────────────────────────────────

  describe('GET /download', () => {
    it('returns 404 when config file does not exist', async () => {
      const res = await fetch(`${baseUrl}/download`);
      expect(res.status).toBe(404);
    });

    it('returns a zip with correct headers when config exists', async () => {
      writeFileSync(configPath, JSON.stringify(VALID_CONFIG));
      const res = await fetch(`${baseUrl}/download`);
      const body = await res.text();
      expect(res.status, `Server error body: ${body}`).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/zip');
      expect(res.headers.get('content-disposition')).toMatch(/attachment.*\.zip/);
    });

    it('zip filename is derived from siteName', async () => {
      writeFileSync(configPath, JSON.stringify(VALID_CONFIG));
      const res = await fetch(`${baseUrl}/download`);
      expect(res.headers.get('content-disposition')).toContain('server-test-site');
    });

    it('returns a non-empty zip body', async () => {
      writeFileSync(configPath, JSON.stringify(VALID_CONFIG));
      const res = await fetch(`${baseUrl}/download`);
      const buf = await res.arrayBuffer();
      expect(buf.byteLength).toBeGreaterThan(0);
    });

    it('returns 500 when config has invalid JSON', async () => {
      writeFileSync(configPath, '{ bad json }');
      const res = await fetch(`${baseUrl}/download`);
      expect(res.status).toBe(500);
    });
  });
});
