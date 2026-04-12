import { expect, test } from '@playwright/test';

test('home page renders the platform name', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Acme Platform/i })).toBeVisible();
  await expect(
    page.getByText(/Build SaaS-grade platforms without rebuilding the foundation every sprint\./i),
  ).toBeVisible();
});
