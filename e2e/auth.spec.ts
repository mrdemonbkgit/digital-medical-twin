import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('displays login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /digital medical twin/i })).toBeVisible();
      await expect(page.getByText(/sign in to your account/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('shows browser validation for empty email', async ({ page }) => {
      await page.goto('/login');

      // The form has HTML5 required validation
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('email input has correct type', async ({ page }) => {
      await page.goto('/login');

      // Email field should have type="email" for browser validation
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('has link to register page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /sign up/i });
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Register Page', () => {
    test('displays registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('heading', { name: /digital medical twin/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('shows validation error for password mismatch', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/^password$/i).fill('password123');
      await page.getByLabel(/confirm password/i).fill('different123');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('shows validation error for short password', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/^password$/i).fill('short');
      await page.getByLabel(/confirm password/i).fill('short');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    });

    test('has link to login page', async ({ page }) => {
      await page.goto('/register');

      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects to login when accessing dashboard unauthenticated', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects to login when accessing timeline unauthenticated', async ({ page }) => {
      await page.goto('/timeline');

      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects to login when accessing settings unauthenticated', async ({ page }) => {
      await page.goto('/settings');

      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects to login when accessing AI chat unauthenticated', async ({ page }) => {
      await page.goto('/ai');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Navigation', () => {
    test('can navigate from login to register', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /sign up/i }).click();

      await expect(page).toHaveURL(/\/register/);
    });

    test('can navigate from register to login', async ({ page }) => {
      await page.goto('/register');

      await page.getByRole('link', { name: /sign in/i }).click();

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
