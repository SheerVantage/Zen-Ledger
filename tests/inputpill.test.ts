import { test, expect } from '@playwright/test';

test.describe('InputPill Component Global', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
    });

    test('global InputPill should have specific styling classes', async ({ page }) => {
        // Find and click the "Add" or "Mic" button in the bottom nav to show the input
        const addButton = page.locator('nav button').nth(2); // Assuming center button is Add
        await addButton.click();
        
        const inputContainer = page.locator('section.fixed.bottom-0 .relative.flex.items-center');
        await expect(inputContainer).toHaveClass(/bg-zen-surface/);
    });
});
