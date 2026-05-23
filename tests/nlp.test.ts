import { test, expect } from '@playwright/test';
import { openGlobalInput } from './helpers';

test.describe('NLP Accuracy (TC-1)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should parse a basic expense: "Coffee 5"', async ({ page }) => {
        const input = await openGlobalInput(page);
        await input.fill('Coffee 5');
        await input.press('Enter');

        await page.waitForTimeout(1000);

        await page.goto('/stream');
        const card = page.locator('div.group', { hasText: 'Coffee' }).first();
        await expect(card).toContainText('Coffee');
        await expect(card).toContainText('5');
    });

    test('should parse a basic income: "Salary 2000"', async ({ page }) => {
        const input = await openGlobalInput(page);
        await input.fill('Salary 2000');
        await input.press('Enter');

        await page.waitForTimeout(1000);

        await page.goto('/stream');

        const card = page.locator('div.group', { hasText: 'Salary 2000' });
        await expect(card.getByText('2,000.00')).toBeVisible();
    });
});
