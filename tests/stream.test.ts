import { test, expect } from '@playwright/test';
import { openGlobalInput } from './helpers';

test.describe('Transaction Stream (TC-3)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const input = await openGlobalInput(page);
        await input.fill('Coffee StreamMarker 5');
        await input.press('Enter');

        await page.waitForTimeout(1000);

        await page.goto('/stream');
    });

    test('should show sticky headers on scroll', async ({ page }) => {
        await expect(page.getByText('Coffee StreamMarker 5')).toBeVisible();
        await expect(page.locator('h2').first()).toBeVisible();
    });

    test('should expand a card on click', async ({ page }) => {
        const card = page.locator('div.group').filter({ hasText: 'Coffee StreamMarker 5' }).first();
        await card.scrollIntoViewIfNeeded();
        await card.click({ position: { x: 24, y: 48 } });

        await expect(card.locator('button:has-text("Edit")')).toBeVisible();
        await expect(card.locator('button:has-text("Delete")')).toBeVisible();
    });

    test('should focus narration textarea when entering edit mode', async ({ page }) => {
        const card = page.locator('div.group').filter({ hasText: 'Coffee StreamMarker 5' }).first();
        await card.scrollIntoViewIfNeeded();
        await card.click({ position: { x: 24, y: 48 } });

        await page.getByRole('button', { name: 'Edit' }).click();

        const narration = page.locator('textarea[id^="edit-narration-"]');
        await expect(narration).toBeVisible();
        await expect(narration).toBeFocused();

        // Focus should allow typing without clicking the textarea again
        await page.keyboard.type(' EDITED');
        await expect(narration).toHaveValue('Coffee StreamMarker 5 EDITED');
    });

    test('should focus narration when FAB capture input is open', async ({ page }) => {
        await page.getByRole('button', { name: 'Add transaction' }).click();
        await expect(page.getByTestId('capture-input')).toBeVisible();

        const card = page.locator('div.group').filter({ hasText: 'Coffee StreamMarker 5' }).first();
        await card.scrollIntoViewIfNeeded();
        await card.click({ position: { x: 24, y: 48 } });
        await page.getByRole('button', { name: 'Edit' }).click();

        const narration = page.locator('textarea[id^="edit-narration-"]');
        const fab = page.getByRole('button', { name: 'Add transaction' });

        await expect(narration).toBeVisible();
        await expect(page.getByTestId('capture-input')).not.toBeVisible();
        await expect(narration).toBeFocused();
        await expect(fab).not.toBeFocused();

        const active = await page.evaluate(() => ({
            tag: document.activeElement?.tagName ?? null,
            capture: document.activeElement?.hasAttribute('data-capture-input') ?? false,
            editId: document.activeElement?.id?.startsWith('edit-narration-') ?? false,
        }));
        expect(active.capture).toBe(false);
        expect(active.editId).toBe(true);
    });

    test('should delete a transaction and update the list', async ({ page }) => {
        page.on('dialog', (dialog) => dialog.accept());

        const card = page.locator('div.group').filter({ hasText: 'Coffee StreamMarker 5' }).first();
        await card.scrollIntoViewIfNeeded();
        await card.click({ position: { x: 24, y: 48 } });

        const deleteBtn = page.locator('button:has-text("Delete")');
        await deleteBtn.click();

        await expect(page.locator('div.group', { hasText: 'Coffee StreamMarker 5' })).not.toBeVisible();
    });
});
