import { expect, test } from '@playwright/test';

test('home page renders the platform name', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Acme Platform/i })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /Build SaaS-grade platforms without rebuilding the foundation every sprint\./i,
    }),
  ).toBeVisible();
});
