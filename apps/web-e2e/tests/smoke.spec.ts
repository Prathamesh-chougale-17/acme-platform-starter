import { expect, test } from '@playwright/test';

test('home page renders the platform name', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Acme Platform/i })).toBeVisible();
});
