import { expect, test } from '@playwright/test';

test('home page renders the platform name', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Acme Platform/i })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: /Build internal tools and SaaS surfaces on a canvas that already knows how to scale\./i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Open users workspace/i })).toBeVisible();
});
