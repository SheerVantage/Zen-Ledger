import { test, expect } from '@playwright/test';
import { openGlobalInput } from './helpers';

test.describe('Edit focus on mobile viewport', () => {
    test.use({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const input = await openGlobalInput(page);
        await input.fill('Coffee StreamMarker 5');
        await input.press('Enter');
        await page.waitForTimeout(1200);
        await page.goto('/stream');
    });

    test('textarea receives focus after Edit on mobile', async ({ page }) => {
        const card = page.locator('div.group').filter({ hasText: 'Coffee StreamMarker 5' }).first();
        await card.scrollIntoViewIfNeeded();
        await card.tap();
        await page.getByRole('button', { name: 'Edit' }).tap();

        const narration = page.locator('textarea[id^="edit-narration-"]');
        await expect(narration).toBeVisible();

        const active = await page.evaluate(() => ({
            tag: document.activeElement?.tagName ?? null,
            id: (document.activeElement as HTMLElement | null)?.id ?? null,
        }));

        console.log('mobile active element:', active);
        expect(active.tag).toBe('TEXTAREA');
    });

    test('card click then Edit with touch coordinates', async ({ page }) => {
        const card = page.locator('div.group').filter({ hasText: 'Coffee StreamMarker 5' }).first();
        await card.scrollIntoViewIfNeeded();
        await card.click({ position: { x: 24, y: 48 } });
        await page.getByRole('button', { name: 'Edit' }).click();

        await page.waitForTimeout(500);

        const active = await page.evaluate(() => document.activeElement?.tagName);
        console.log('after click active:', active);
        expect(active).toBe('TEXTAREA');
    });
});
