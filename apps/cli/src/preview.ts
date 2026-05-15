import { join, dirname } from 'path';

// ---------------------------------------------------------------------------
// Workspace root detection (pure — injected `check` makes it testable)
// ---------------------------------------------------------------------------

export function findWorkspaceRoot(
  from: string,
  check: (path: string) => boolean
): string {
  let dir = from;
  let prev = '';
  while (dir !== prev) {
    if (check(join(dir, 'nx.json'))) return dir;
    prev = dir;
    dir = dirname(dir);
  }
  throw new Error('Cannot find workspace root (no nx.json found).');
}
