import { test, expect } from '@playwright/test';
// Basic no-JS rendering & PE booking form presence
test.describe('Fare page no-JS', () => {
    test.use({ javaScriptEnabled: false });
    test('renders content & noscript booking form', async ({ page }) => {
        await page.goto('/raipur/bilaspur/fare');
        await expect(page.locator('h1')).toContainText('Raipur to Bilaspur');
        // noscript form should be visible (JS disabled) with booking fields
        await expect(page.locator('form[action="/api/v1/bookings/pe"]')).toBeVisible();
        await page.locator('input[name="pickup_datetime"]').fill('2030-01-01T10:00');
        await page.locator('input[name="customer_phone"]').fill('9999999999');
        await page.locator('form[action="/api/v1/bookings/pe"]').evaluate(form => form.submit());
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('text=Booking Received')).toBeVisible();
    });
});
