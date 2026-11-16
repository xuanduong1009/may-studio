import { expect, type Page } from "@playwright/test";

/** Shared by playwright.config.ts (which seeds the admin) and the tests (which sign in as it). */
export const E2E_PORT = 3100;
export const E2E_URL = `http://localhost:${E2E_PORT}`;
export const ADMIN = { email: "admin@may.studio", password: "e2e-admin-password" };

/** A product that the seed always creates, in several sizes. */
export const PRODUCT_SLUG = "ao-thun-co-tron-basic";

/**
 * Opens the product page and adds its first in-stock size to the cart.
 * A click that lands before React has hydrated the page does nothing, so the size click is retried
 * until the button reports itself selected.
 */
export async function addToCart(page: Page, slug = PRODUCT_SLUG) {
  await page.goto(`/product/${slug}`);
  // size options are toggle buttons (aria-pressed); the size finder and size guide links next to them are not
  const size = page.locator("#size-picker button[aria-pressed]:not([disabled])").first();
  await expect(async () => {
    await size.click();
    await expect(size).toHaveAttribute("aria-pressed", "true", { timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  await expect(page.getByText("Đã thêm vào giỏ hàng").first()).toBeVisible();
}
