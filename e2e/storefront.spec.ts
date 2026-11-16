import { expect, test } from "@playwright/test";

// Runs on a desktop browser and on a phone (see playwright.config.ts).

test("home page shows the hero and the best sellers", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nhẹ");
  await expect(page.getByRole("heading", { name: "Được yêu thích nhất" })).toBeVisible();
  expect(await page.locator("main article").count()).toBeGreaterThanOrEqual(8);
});

test("shop filters by category through the URL", async ({ page }) => {
  await page.goto("/shop");
  await page
    .getByRole("button", { name: /^Áo thun/ })
    .first()
    .click();
  await expect(page).toHaveURL(/category=ao-thun/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Áo thun");
  await expect(page.locator("main article").first()).toBeVisible();
});

test("instant search finds products without typing accents", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tìm kiếm" }).first().click();
  await page.getByRole("combobox").fill("ao thun");
  await expect(page.getByRole("option").first()).toContainText(/áo thun/i);
});

test("the store switches to English", async ({ page, isMobile }) => {
  test.skip(isMobile, "the language switch lives in the menu on phones");
  await page.goto("/");
  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { name: "Customer favourites" })).toBeVisible();
});

test("unknown pages show the not-found page", async ({ page }) => {
  await page.goto("/trang-khong-ton-tai");
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
});
