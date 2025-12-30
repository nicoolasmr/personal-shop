
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VIDA360/);
});

test('root redirects to login and loads form', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    await page.goto('/');

    // Wait a bit for lazy chunks
    await page.waitForTimeout(5000);

    const content = await page.content();

    // Check for email input using placeholder
    await expect(page.getByPlaceholder('seu@email.com')).toBeVisible({ timeout: 10000 });

    // Also check button
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});
