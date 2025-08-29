import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('should display payment form', async ({ page }) => {
    await page.goto('/diagnostic/results?summary=Test summary');
    
    // Check if payment form is present
    await expect(page.locator('.payment-form')).toBeVisible();
    await expect(page.locator('input[name="cardNumber"]')).toBeVisible();
    await expect(page.locator('input[name="expiryDate"]')).toBeVisible();
    await expect(page.locator('input[name="cvv"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test('should validate payment form fields', async ({ page }) => {
    await page.goto('/diagnostic/results?summary=Test summary');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('.text-danger')).toBeVisible();
  });

  test('should fill and submit payment form', async ({ page }) => {
    await page.goto('/diagnostic/results?summary=Test summary');
    
    // Fill in payment details
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="name"]', 'Test User');
    
    // Submit payment
    await page.click('button[type="submit"]');
    
    // Should redirect to success page
    await expect(page).toHaveURL(/.*payment-success/);
  });

  test('should handle payment errors gracefully', async ({ page }) => {
    await page.goto('/diagnostic/results?summary=Test summary');
    
    // Fill in invalid payment details
    await page.fill('input[name="cardNumber"]', '4000000000000002'); // Declined card
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="name"]', 'Test User');
    
    // Submit payment
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('should show loading state during payment processing', async ({ page }) => {
    await page.goto('/diagnostic/results?summary=Test summary');
    
    // Fill in payment details
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="name"]', 'Test User');
    
    // Submit payment
    await page.click('button[type="submit"]');
    
    // Button should be disabled during processing
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should display payment success page', async ({ page }) => {
    await page.goto('/payment-success?session_id=test_session');
    
    // Check success page elements
    await expect(page.locator('h1')).toContainText('Payment Successful');
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('text=Continue to Dashboard')).toBeVisible();
  });
});
