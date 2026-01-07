import { test, expect } from '@playwright/test';

test('creator onboarding flow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@creator.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 2. Start onboarding
  await expect(page).toHaveURL('/onboard');

  // 3. Fill business info
  await page.fill('input[name="displayName"]', 'Test Makeup Studio');
  await page.fill('textarea[name="bio"]', 'Professional makeup artist based in Lagos');
  await page.selectOption('select[name="category"]', 'makeup');
  await page.click('button:has-text("Next")');

  // 4. Fill bank details
  await page.selectOption('select[name="bankCode"]', '058'); // GTBank
  await page.fill('input[name="accountNumber"]', '0123456789');
  await page.fill('input[name="accountName"]', 'Test Creator');
  await page.click('button:has-text("Next")');

  // 5. Set subscription plan
  await page.fill('input[name="planName"]', 'Basic');
  await page.fill('input[name="planPrice"]', '5000');
  await page.click('button:has-text("Next")');

  // 6. Select platform plan
  await page.selectOption('select[name="platformPlan"]', 'starter');
  await page.click('button:has-text("Complete Setup")');

  // 7. Verify success
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Welcome back');
});

