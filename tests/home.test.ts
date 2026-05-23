import { test, expect } from '@playwright/test';
import { openGlobalInput } from './helpers';

test.describe('Home Page Interactions (TC-2)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should show initial state in StatusRing', async ({ page }) => {
        await expect(page.getByText('Safe to spend')).toBeVisible();
        await expect(page.getByRole('img', { name: /Safe to spend: ৳2000/i })).toBeVisible();
    });

    test('should update balance after adding an expense', async ({ page }) => {
        const input = await openGlobalInput(page);
        await input.fill('Coffee 50');
        await input.press('Enter');

        await expect(page.getByText('Got it')).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('button', { name: /Transaction: Coffee 50/i })).toBeVisible();
    });

    test('should toggle theme and update data-theme attribute', async ({ page }) => {
        const toggleButton = page.getByRole('button', { name: 'Toggle Theme' });
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'zen');

        await toggleButton.click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

        await toggleButton.click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'zen');
    });
});
