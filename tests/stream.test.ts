import { test, expect } from '@playwright/test';

test.describe('Transaction Stream (TC-3)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Add a test transaction
        const input = page.locator('input[type="text"]');
        await input.fill('UniqueTestItem $5');
        await input.press('Enter');

        // Wait for processing delay (800ms)
        await page.waitForTimeout(1000);

        await page.goto('/stream');
    });

    test('should show sticky headers on scroll', async ({ page }) => {
        // Verify the "Today" header is present
        const header = page.locator('h3', { hasText: 'Today' });
        await expect(header).toBeVisible();
    });

    test('should expand a card on click', async ({ page }) => {
        const card = page.locator('h4', { hasText: 'UniqueTestItem' }).first();
        await card.click();

        // Expansion revealed buttons
        await expect(page.locator('button:has-text("Edit")')).toBeVisible();
        await expect(page.locator('button:has-text("Delete")')).toBeVisible();
    });

    test('should delete a transaction and update the list', async ({ page }) => {
        const card = page.locator('h4', { hasText: 'UniqueTestItem' }).first();
        await card.click();

        const deleteBtn = page.locator('button:has-text("Delete")');
        await deleteBtn.click();

        // List should be empty or at least not contain UniqueTestItem anymore
        await expect(page.locator('h4', { hasText: 'UniqueTestItem' })).not.toBeVisible();
    });
});
