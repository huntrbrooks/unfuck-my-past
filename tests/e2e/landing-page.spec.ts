import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the main landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check main elements are present
    await expect(page.locator('h1')).toContainText('Unfuck Your Past');
    await expect(page.locator('text=AI-driven self-healing')).toBeVisible();
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=How It Works')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('should navigate to how it works page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=How It Works');
    await expect(page).toHaveURL('/how-it-works');
    await expect(page.locator('h1')).toContainText('How It Works');
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/.*sign-up/);
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Check if mobile menu button is present
    await expect(page.locator('[aria-controls="basic-navbar-nav"]')).toBeVisible();
  });
});
