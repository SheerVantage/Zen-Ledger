import { test, expect } from '@playwright/test';
import { openGlobalInput } from './helpers';

test.describe('InputPill Component Global', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
    });

    test('global InputPill should have specific styling classes', async ({ page }) => {
        await openGlobalInput(page);

        const inputContainer = page.locator('section.fixed.bottom-0 .relative.flex.items-center').first();
        await expect(inputContainer).toHaveClass(/bg-zen-surface/);
    });

    test('capture input receives focus when global sheet opens', async ({ page }) => {
        await page.getByRole('button', { name: /add transaction/i }).click();

        const input = page.getByTestId('capture-input');
        await expect(input).toBeVisible();
        await expect(input).toBeFocused();

        await page.keyboard.type('Coffee 5');
        await expect(input).toHaveValue('Coffee 5');
    });
});
