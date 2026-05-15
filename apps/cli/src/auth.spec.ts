import { describe, it, expect } from 'vitest';
import { resolveApiKey } from './auth.js';

// ---------------------------------------------------------------------------
// resolveApiKey — env-var / inline-key path (no I/O, no stdin)
// ---------------------------------------------------------------------------
// The saved-key path reads CONFIG_DIR which is resolved at module load time
// from os.homedir() — not patchable after import. The interactive-prompt path
// requires stdin mocking. Both are integration concerns deferred to e2e.

describe('resolveApiKey — inline key provided', () => {
  it('returns the key immediately without I/O', async () => {
    const result = await resolveApiKey('sk-or-test-key-1234');
    expect(result).toBe('sk-or-test-key-1234');
  });

  it('returns any non-empty string as-is (validation is caller responsibility)', async () => {
    const result = await resolveApiKey('any-string');
    expect(result).toBe('any-string');
  });
});
