import { describe, it, expect } from 'vitest';
import { toKebab } from './scaffold.js';

describe('toKebab', () => {
  it('lowercases and hyphenates normal names', () => {
    expect(toKebab('My Awesome Site')).toBe('my-awesome-site');
  });

  it('strips special characters', () => {
    expect(toKebab('Syncly Pro!')).toBe('syncly-pro');
  });

  it('collapses multiple spaces/separators into one hyphen', () => {
    expect(toKebab('Hello   World')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toKebab('  --My Site--  ')).toBe('my-site');
  });

  it('handles camelCase input', () => {
    expect(toKebab('myLandingPage')).toBe('mylandingpage');
  });

  it('handles already-kebab input unchanged', () => {
    expect(toKebab('my-site')).toBe('my-site');
  });

  it('returns fallback for empty/whitespace input', () => {
    expect(toKebab('')).toBe('landing-page');
    expect(toKebab('   ')).toBe('landing-page');
  });

  it('returns fallback for special-chars-only input', () => {
    expect(toKebab('!!!')).toBe('landing-page');
  });

  it('handles unicode gracefully by stripping non-ascii', () => {
    expect(toKebab('Café & Bistro')).toBe('caf-bistro');
  });

  it('handles numbers in names', () => {
    expect(toKebab('Studio 54')).toBe('studio-54');
  });
});
