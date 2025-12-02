import { test, expect } from '@playwright/test';

test.describe('Lab Uploads', () => {
  test.describe('Unauthenticated Access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/lab-uploads');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('login page shows after redirect from lab uploads', async ({ page }) => {
      await page.goto('/lab-uploads');

      // Should show login form with app title
      await expect(page.getByRole('heading', { name: /digital medical twin/i })).toBeVisible();
    });
  });
});
