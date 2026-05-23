import { expect, type Page } from '@playwright/test';

export async function openGlobalInput(page: Page) {
    await page.getByRole('button', { name: /add transaction/i }).click();
    const input = page.getByTestId('capture-input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    return input;
}
