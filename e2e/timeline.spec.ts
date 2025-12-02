import { test, expect } from '@playwright/test';

test.describe('Timeline', () => {
  test.describe('Unauthenticated Access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/timeline');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('login page shows after redirect from timeline', async ({ page }) => {
      await page.goto('/timeline');

      // Should show login form with app title
      await expect(page.getByRole('heading', { name: /digital medical twin/i })).toBeVisible();
    });
  });
});
