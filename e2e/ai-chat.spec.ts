import { test, expect } from '@playwright/test';

test.describe('AI Chat', () => {
  test.describe('Unauthenticated Access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/ai');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('login page shows after redirect from AI page', async ({ page }) => {
      await page.goto('/ai');

      // Should show login form with app title
      await expect(page.getByRole('heading', { name: /digital medical twin/i })).toBeVisible();
    });
  });
});
