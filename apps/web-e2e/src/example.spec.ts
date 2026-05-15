import { test, expect } from '@playwright/test';

// Placeholder — real e2e tests for the preview config editor are deferred to v0.3.
// When added, they should:
//   1. Start the CLI preview server with a known config.json
//   2. Assert the config editor loads and shows the site name
//   3. Assert "Download Project" button is visible
//   4. Assert clicking "↓ JSON" downloads a config.json file
test('config editor loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeAttached();
});
