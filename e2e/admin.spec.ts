import { expect, test } from "@playwright/test";
import { ADMIN } from "./fixtures";

test("an admin signs in and reaches the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(ADMIN.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
  await expect(page.getByText("Doanh thu (30 ngày)")).toBeVisible();
});

test("a customer account cannot open the back office", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Họ và tên", { exact: true }).fill("Khách Kiểm Thử");
  await page.getByLabel("Email", { exact: true }).fill(`customer-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("customer-password-123");
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
});
