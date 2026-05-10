import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import type concurrently from 'concurrently';
import { findWorkspaceRoot, runPreview, defaultConfig } from './preview.js';

// ---------------------------------------------------------------------------
// findWorkspaceRoot
// ---------------------------------------------------------------------------

describe('findWorkspaceRoot', () => {
  it('returns the directory that contains nx.json', () => {
    const check = (p: string) => p === '/repo/nx.json';
    expect(findWorkspaceRoot('/repo/apps/cli/src', check)).toBe('/repo');
  });

  it('finds the root even when called from a deeply nested path', () => {
    const check = (p: string) => p === '/workspace/nx.json';
    expect(findWorkspaceRoot('/workspace/apps/cli/dist', check)).toBe('/workspace');
  });

  it('throws when no nx.json is found anywhere in the tree', () => {
    const check = () => false;
    expect(() => findWorkspaceRoot('/some/path', check)).toThrow(
      'Cannot find workspace root'
    );
  });
});

// ---------------------------------------------------------------------------
// runPreview — config.json scaffolding
// ---------------------------------------------------------------------------

describe('runPreview — config.json', () => {
  const workspaceRoot = '/workspace';
  const userCwd = '/home/user/myproject';

  let writeFile: ReturnType<typeof vi.fn>;
  let run: typeof concurrently;

  beforeEach(() => {
    writeFile = vi.fn();
    run = vi.fn().mockReturnValue({ result: Promise.resolve() }) as unknown as typeof concurrently;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('creates config.json with the default scaffold when the file does not exist', () => {
    runPreview({
      cwd: () => userCwd,
      fileExists: () => false,
      writeFile,
      run,
      workspaceRoot,
    });

    expect(writeFile).toHaveBeenCalledOnce();
    const [writtenPath, writtenContent] = writeFile.mock.calls[0] as [string, string];
    expect(writtenPath).toBe(join(userCwd, 'config.json'));
    expect(JSON.parse(writtenContent)).toMatchObject({
      metadata: { siteName: 'My Landing Page' },
      sections: expect.arrayContaining([
        expect.objectContaining({ type: 'HERO' }),
        expect.objectContaining({ type: 'FEATURES' }),
        expect.objectContaining({ type: 'CTA' }),
      ]),
    });
  });

  it('does not overwrite config.json when it already exists', () => {
    runPreview({
      cwd: () => userCwd,
      fileExists: () => true,
      writeFile,
      run,
      workspaceRoot,
    });

    expect(writeFile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// runPreview — concurrently invocation
// ---------------------------------------------------------------------------

describe('runPreview — process orchestration', () => {
  const workspaceRoot = '/workspace';
  const userCwd = '/home/user/myproject';

  let run: typeof concurrently;

  beforeEach(() => {
    run = vi.fn().mockReturnValue({ result: Promise.resolve() }) as unknown as typeof concurrently;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('starts exactly two processes (api and web)', () => {
    runPreview({
      cwd: () => userCwd,
      fileExists: () => true,
      writeFile: vi.fn(),
      run,
      workspaceRoot,
    });

    expect(run).toHaveBeenCalledOnce();
    const [commands] = (run as ReturnType<typeof vi.fn>).mock.calls[0] as [Array<{ name: string }>];
    expect(commands).toHaveLength(2);
    expect(commands.map((c) => c.name)).toEqual(['api', 'web']);
  });

  it('passes CONFIG_PATH pointing to config.json in the user cwd', () => {
    runPreview({
      cwd: () => userCwd,
      fileExists: () => true,
      writeFile: vi.fn(),
      run,
      workspaceRoot,
    });

    const [commands] = (run as ReturnType<typeof vi.fn>).mock.calls[0] as [Array<{ name: string; env?: Record<string, string> }>];
    const api = commands.find((c) => c.name === 'api')!;
    expect(api.env?.['CONFIG_PATH']).toBe(join(userCwd, 'config.json'));
  });

  it('points the api command at the api entry file inside the workspace root', () => {
    runPreview({
      cwd: () => userCwd,
      fileExists: () => true,
      writeFile: vi.fn(),
      run,
      workspaceRoot,
    });

    const [commands] = (run as ReturnType<typeof vi.fn>).mock.calls[0] as [Array<{ name: string; command: string }>];
    const api = commands.find((c) => c.name === 'api')!;
    expect(api.command).toContain(join(workspaceRoot, 'apps', 'api', 'src', 'index.ts'));
  });

  it('runs the web command from the workspace root', () => {
    runPreview({
      cwd: () => userCwd,
      fileExists: () => true,
      writeFile: vi.fn(),
      run,
      workspaceRoot,
    });

    const [commands] = (run as ReturnType<typeof vi.fn>).mock.calls[0] as [Array<{ name: string; cwd?: string }>];
    const web = commands.find((c) => c.name === 'web')!;
    expect(web.cwd).toBe(workspaceRoot);
  });
});

// ---------------------------------------------------------------------------
// defaultConfig shape
// ---------------------------------------------------------------------------

describe('defaultConfig', () => {
  it('has valid metadata with hex colors', () => {
    expect(defaultConfig.metadata.colors.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(defaultConfig.metadata.colors.secondary).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('contains all three section types', () => {
    const types = defaultConfig.sections.map((s) => s.type);
    expect(types).toContain('HERO');
    expect(types).toContain('FEATURES');
    expect(types).toContain('CTA');
  });
});
