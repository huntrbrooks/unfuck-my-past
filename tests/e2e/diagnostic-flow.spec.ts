import { test, expect } from '@playwright/test';

test.describe('Diagnostic Flow', () => {
  test('should display diagnostic questions', async ({ page }) => {
    await page.goto('/diagnostic');
    
    // Check if questions are loaded
    await expect(page.locator('.question-card')).toBeVisible();
    await expect(page.locator('textarea[name="response"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should submit a diagnostic response', async ({ page }) => {
    await page.goto('/diagnostic');
    
    // Wait for question to load
    await expect(page.locator('.question-card')).toBeVisible();
    
    // Fill in response
    await page.fill('textarea[name="response"]', 'This is a test response for the diagnostic question.');
    
    // Submit response
    await page.click('button[type="submit"]');
    
    // Check if insight is generated
    await expect(page.locator('.insight-card')).toBeVisible();
  });

  test('should show loading states during submission', async ({ page }) => {
    await page.goto('/diagnostic');
    
    // Wait for question to load
    await expect(page.locator('.question-card')).toBeVisible();
    
    // Fill in response
    await page.fill('textarea[name="response"]', 'Test response');
    
    // Submit and check loading state
    await page.click('button[type="submit"]');
    
    // Button should be disabled during submission
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should handle empty response validation', async ({ page }) => {
    await page.goto('/diagnostic');
    
    // Wait for question to load
    await expect(page.locator('.question-card')).toBeVisible();
    
    // Try to submit without response
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('.text-danger')).toBeVisible();
  });

  test('should navigate to results page after completion', async ({ page }) => {
    // Mock the diagnostic completion by going directly to results
    await page.goto('/diagnostic/results?summary=Test summary');
    
    // Check if results page loads
    await expect(page.locator('h1')).toContainText('Your Diagnostic Results');
    await expect(page.locator('.summary-card')).toBeVisible();
  });
});
