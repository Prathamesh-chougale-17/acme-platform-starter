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

  await page.getByRole('button', { name: /Explore platform/i }).click();
  await expect(page.getByRole('link', { name: /API Docs/i })).toBeVisible();
});

test('public API docs render on the same origin', async ({ page }) => {
  await page.goto('/api/v1/docs');

  await expect(page).toHaveTitle(/Acme Platform API/i);
});
