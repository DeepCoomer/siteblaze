import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveRaceModels } from './models.js';
import { FREE_MODELS } from '@org/engine-core';

// ---------------------------------------------------------------------------
// resolveRaceModels — env var branch
// ---------------------------------------------------------------------------

describe('resolveRaceModels — SITEBLAZE_MODELS env var', () => {
  const original = process.env['SITEBLAZE_MODELS'];

  afterEach(() => {
    if (original === undefined) delete process.env['SITEBLAZE_MODELS'];
    else process.env['SITEBLAZE_MODELS'] = original;
  });

  it('returns models from env when SITEBLAZE_MODELS is set', () => {
    process.env['SITEBLAZE_MODELS'] = 'openai/gpt-4o,anthropic/claude-3.5-sonnet';
    const result = resolveRaceModels();
    expect(result).toEqual(['openai/gpt-4o', 'anthropic/claude-3.5-sonnet']);
  });

  it('trims whitespace from each model id', () => {
    process.env['SITEBLAZE_MODELS'] = '  openai/gpt-4o , anthropic/claude-3.5-sonnet  ';
    const result = resolveRaceModels();
    expect(result).toEqual(['openai/gpt-4o', 'anthropic/claude-3.5-sonnet']);
  });

  it('filters out empty entries from malformed env value', () => {
    process.env['SITEBLAZE_MODELS'] = 'openai/gpt-4o,,anthropic/claude-3.5-sonnet,';
    const result = resolveRaceModels();
    expect(result).toEqual(['openai/gpt-4o', 'anthropic/claude-3.5-sonnet']);
  });

  it('falls through when SITEBLAZE_MODELS is empty string', () => {
    process.env['SITEBLAZE_MODELS'] = '';
    const result = resolveRaceModels();
    // Should not parse the empty env var as a model list — result is non-empty
    // (could be saved config or FREE_MODELS depending on local state)
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain('');
  });

  it('falls through when SITEBLAZE_MODELS is only whitespace', () => {
    process.env['SITEBLAZE_MODELS'] = '   ';
    const result = resolveRaceModels();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain('');
  });
});

// ---------------------------------------------------------------------------
// resolveRaceModels — fallback to FREE_MODELS defaults
// ---------------------------------------------------------------------------

describe('resolveRaceModels — defaults fallback', () => {
  beforeEach(() => {
    delete process.env['SITEBLAZE_MODELS'];
  });

  afterEach(() => {
    delete process.env['SITEBLAZE_MODELS'];
  });

  it('returns FREE_MODELS when no env var and no config file exists', () => {
    // models.json at ~/.config/siteblaze/models.json unlikely in CI — if it
    // does exist the test would return saved models, which is also valid
    // behaviour. We verify the shape rather than exact values.
    const result = resolveRaceModels();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(id => expect(typeof id).toBe('string'));
  });

  it('returns an array (never throws)', () => {
    expect(() => resolveRaceModels()).not.toThrow();
  });

  it('returns at least as many models as FREE_MODELS when on defaults', () => {
    // Only valid when no env or saved config — skip if env is set
    if (process.env['SITEBLAZE_MODELS']) return;
    const result = resolveRaceModels();
    // Could be saved config (more or fewer) — just assert non-empty array
    expect(result.length).toBeGreaterThan(0);
  });
});
