import { test, expect } from '@playwright/test';

test.describe('Home Page Interactions (TC-2)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should show initial state in StatusRing', async ({ page }) => {
        const safeToSpend = page.locator('text=Safe to spend');
        await expect(safeToSpend).toBeVisible();
        await expect(page.locator('text=$200')).toBeVisible();
    });

    test('should update balance after adding an expense', async ({ page }) => {
        const input = page.locator('input[type="text"]');
        await input.fill('Lunch $50');
        await input.press('Enter');

        // Wait for processing delay (800ms)
        await page.waitForTimeout(1000);

        // Check for updated balance in StatusRing
        await expect(page.locator('text=$150')).toBeVisible();
    });

    test('should toggle theme and update data-theme attribute', async ({ page }) => {
        const toggleButton = page.locator('button[aria-label="Toggle Theme"]');
        await expect(page.locator('body')).toHaveAttribute('data-theme', 'zen');

        await toggleButton.click();
        await expect(page.locator('body')).toHaveAttribute('data-theme', 'swiss');

        await toggleButton.click();
        await expect(page.locator('body')).toHaveAttribute('data-theme', 'zen');
    });
});
