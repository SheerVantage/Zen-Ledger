import { test, expect } from '@playwright/test';

test.describe('NLP Accuracy (TC-1)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear local storage to ensure a clean state
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should parse a basic expense: "Coffee $5"', async ({ page }) => {
        const input = page.locator('input[type="text"]');
        await input.fill('Coffee $5');
        await input.press('Enter');

        // Wait for the intentional "Zen" processing delay (800ms)
        await page.waitForTimeout(1000);

        // Check if it appears in the list
        await page.goto('/stream');
        const firstTransaction = page.locator('h4').first();
        await expect(firstTransaction).toContainText('Coffee');

        const amount = page.locator('.text-zen-spend').first();
        await expect(amount).toContainText('$5.00');
    });

    test('should parse a basic income: "Salary $2000"', async ({ page }) => {
        const input = page.locator('input[type="text"]');
        await input.fill('Salary $2000');
        await input.press('Enter');

        // Wait for the intentional "Zen" processing delay (800ms)
        await page.waitForTimeout(1000);

        await page.goto('/stream');

        // Use exact text match to find the specific "Salary" transaction title
        const specificSalaryCard = page.locator('h4', { hasText: /^Salary$/ }).first();
        await expect(specificSalaryCard).toBeVisible();

        // Find the amount within the same card container
        const cardContainer = page.locator('div.w-full', { has: specificSalaryCard }).first();
        const amount = cardContainer.locator('.text-zen-earn');
        await expect(amount).toContainText('$2000.00');
    });
});
