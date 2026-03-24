import { test, expect } from '@playwright/test';

test.describe('InputPill Component Modes', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/test/inputpill');
    });

    test('standalone mode should have specific styling classes', async ({ page }) => {
        const standalone = page.locator('#standalone-test .relative.flex.items-center');
        await expect(standalone).toHaveClass(/bg-zen-surface/);
        await expect(standalone).toHaveClass(/rounded-full/);
    });

    test('inline mode should have transparent background', async ({ page }) => {
        const inline = page.locator('#inline-test .relative.flex.items-center');
        await expect(inline).toHaveClass(/bg-transparent/);
        await expect(inline).not.toHaveClass(/rounded-full/);
    });
});
