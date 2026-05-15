import { describe, it, expect } from 'vitest';
import { findWorkspaceRoot } from './preview.js';

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
