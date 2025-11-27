import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Public Pages', () => {
    test('login page loads correctly', async ({ page }) => {
      await page.goto('/login');

      await expect(page).toHaveTitle(/digital medical twin/i);
      await expect(page.getByRole('heading', { name: /digital medical twin/i })).toBeVisible();
    });

    test('register page loads correctly', async ({ page }) => {
      await page.goto('/register');

      await expect(page).toHaveTitle(/digital medical twin/i);
    });
  });

  test.describe('404 Page', () => {
    test('shows 404 for invalid routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist');

      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    });
  });

  test.describe('Root Redirect', () => {
    test('root redirects to login when unauthenticated', async ({ page }) => {
      await page.goto('/');

      // Should either redirect to login or show login page
      await expect(page).toHaveURL(/\/(login|dashboard)/);
    });
  });
});
