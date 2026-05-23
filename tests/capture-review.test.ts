import { test, expect } from '@playwright/test';
import { openGlobalInput } from './helpers';

test.describe('Capture review gate', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('fast path saves "Coffee 5" without review sheet', async ({ page }) => {
        const input = await openGlobalInput(page);
        await input.fill('Coffee 5');
        await input.press('Enter');

        await expect(page.getByText('Review before saving')).not.toBeVisible();
        await expect(page.getByText('Got it')).toBeVisible({ timeout: 5000 });
    });

    test('amount-only input "50" opens review sheet', async ({ page }) => {
        const input = await openGlobalInput(page);
        await input.fill('50');
        await input.press('Enter');

        await expect(page.getByText('Review before saving')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Category unclear')).toBeVisible();
    });

    test('"apple 20" opens review for ambiguity', async ({ page }) => {
        const input = await openGlobalInput(page);
        await input.fill('apple 20');
        await input.press('Enter');

        await expect(page.getByText('Review before saving')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Could mean more than one thing')).toBeVisible();
    });

    test('confirming review saves the transaction', async ({ page }) => {
        const input = await openGlobalInput(page);
        await input.fill('50');
        await input.press('Enter');

        await expect(page.getByText('Review before saving')).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: 'Save transaction' }).click();

        await expect(page.getByText('Got it')).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('button', { name: /Transaction: 50/i })).toBeVisible();
    });

    test('"Back to edit" restores original input text', async ({ page }) => {
        const input = await openGlobalInput(page);
        await input.fill('50');
        await input.press('Enter');

        await expect(page.getByText('Review before saving')).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: 'Back to edit' }).click();

        const restoredInput = page.getByTestId('capture-input');
        await expect(restoredInput).toBeVisible();
        await expect(restoredInput).toHaveValue('50');
        await expect(restoredInput).toBeFocused();
    });
});
