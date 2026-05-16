import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { saveToHistory, listHistory, loadHistoryConfig } from './history.js';

const testDir = join(tmpdir(), `siteblaze-history-test-${process.pid}`);

beforeEach(() => mkdirSync(testDir, { recursive: true }));
afterEach(() => rmSync(testDir, { recursive: true, force: true }));

const sampleConfig = { metadata: { siteName: 'Vault', themeMode: 'dark', colors: { primary: '#6366f1', secondary: '#8b5cf6' } }, sections: [] };

// ---------------------------------------------------------------------------
// saveToHistory
// ---------------------------------------------------------------------------

describe('saveToHistory', () => {
  it('creates a JSON file in the history dir', () => {
    saveToHistory(sampleConfig, 'Vault — fintech app', testDir);
    const entries = listHistory(testDir);
    expect(entries).toHaveLength(1);
  });

  it('returns the path of the saved file', () => {
    const path = saveToHistory(sampleConfig, 'Vault — fintech app', testDir);
    expect(typeof path).toBe('string');
    expect(path).toMatch(/\.json$/);
    expect(require('fs').existsSync(path)).toBe(true);
  });

  it('returns undefined when the dir is not writable', () => {
    const path = saveToHistory(sampleConfig, 'prompt', '/nonexistent/path/that/cannot/be/created/xyz');
    expect(path).toBeUndefined();
  });

  it('stores siteName, prompt, and savedAt on the entry', () => {
    saveToHistory(sampleConfig, 'Vault — fintech app', testDir);
    const [entry] = listHistory(testDir);
    expect(entry.siteName).toBe('Vault');
    expect(entry.prompt).toBe('Vault — fintech app');
    expect(entry.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('prunes to 10 entries when more than 10 are saved', async () => {
    for (let i = 0; i < 12; i++) {
      // Ensure unique timestamps via slightly different IDs
      saveToHistory({ metadata: { siteName: `Site${i}` } }, `prompt ${i}`, testDir);
      await new Promise(r => setTimeout(r, 2)); // ensure distinct timestamps
    }
    const entries = listHistory(testDir);
    expect(entries).toHaveLength(10);
  });

  it('does not throw when config has no metadata', () => {
    expect(() => saveToHistory({}, 'bare prompt', testDir)).not.toThrow();
  });

});

// ---------------------------------------------------------------------------
// listHistory
// ---------------------------------------------------------------------------

describe('listHistory', () => {
  it('returns empty array when directory does not exist', () => {
    expect(listHistory('/nonexistent/history/dir')).toEqual([]);
  });

  it('returns empty array when directory is empty', () => {
    expect(listHistory(testDir)).toEqual([]);
  });

  it('returns entries sorted newest first', async () => {
    saveToHistory({ metadata: { siteName: 'First' } }, 'first', testDir);
    await new Promise(r => setTimeout(r, 2));
    saveToHistory({ metadata: { siteName: 'Second' } }, 'second', testDir);
    const entries = listHistory(testDir);
    expect(entries[0].siteName).toBe('Second');
    expect(entries[1].siteName).toBe('First');
  });

  it('skips malformed JSON files without throwing', () => {
    writeFileSync(join(testDir, '0000000000000-bad.json'), 'not valid json');
    saveToHistory(sampleConfig, 'good entry', testDir);
    const entries = listHistory(testDir);
    expect(entries).toHaveLength(1);
    expect(entries[0].siteName).toBe('Vault');
  });
});

// ---------------------------------------------------------------------------
// loadHistoryConfig
// ---------------------------------------------------------------------------

describe('loadHistoryConfig', () => {
  it('returns the config object from a history file', () => {
    saveToHistory(sampleConfig, 'Vault — fintech app', testDir);
    const [entry] = listHistory(testDir);
    const loaded = loadHistoryConfig(entry.path);
    expect(loaded).toEqual(sampleConfig);
  });

  it('throws when the file does not exist', () => {
    expect(() => loadHistoryConfig('/nonexistent/no-such-file.json')).toThrow();
  });
});
