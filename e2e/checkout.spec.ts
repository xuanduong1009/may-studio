import { expect, test } from "@playwright/test";
import { addToCart, PRODUCT_SLUG } from "./fixtures";

test("a guest orders with cash on delivery, stock goes down and the order can be tracked", async ({ page, request }) => {
  const before = await (await request.get(`/api/products/${PRODUCT_SLUG}`)).json();

  await addToCart(page);

  // check out as a guest; cash on delivery is the default payment
  await page.goto("/checkout");
  await page.getByLabel("Họ và tên", { exact: true }).fill("Nguyễn Văn Kiểm Thử");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0912345678");
  await page.getByLabel("Email", { exact: true }).fill("e2e@example.com");
  await page.getByLabel("Địa chỉ", { exact: true }).fill("12 Lê Lợi, Phường Bến Thành");
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();

  await expect(page).toHaveURL(/\/checkout\/success\?code=MAY-/);
  await expect(page.getByRole("heading", { name: "Đặt hàng thành công!" })).toBeVisible();
  const code = new URL(page.url()).searchParams.get("code")!;

  // the server reserved one unit of stock
  const after = await (await request.get(`/api/products/${PRODUCT_SLUG}`)).json();
  expect(after.stock).toBe(before.stock - 1);

  // a guest finds the order with its code and email
  await page.goto(`/track?code=${code}&contact=e2e@example.com`);
  await expect(page.getByText(code).first()).toBeVisible();
  await expect(page.getByText("Chờ xác nhận").first()).toBeVisible();
});

test("checkout refuses an invalid phone number before anything is sent", async ({ page }) => {
  await addToCart(page);
  await page.goto("/checkout");
  await page.getByLabel("Họ và tên", { exact: true }).fill("Nguyễn Văn Kiểm Thử");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("12345");
  await page.getByLabel("Email", { exact: true }).fill("e2e@example.com");
  await page.getByLabel("Địa chỉ", { exact: true }).fill("12 Lê Lợi, Phường Bến Thành");
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();

  // the error message joins the field's label, so match the name by its start
  await expect(page.getByText("Số điện thoại không hợp lệ")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /^Số điện thoại/ })).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/checkout$/);
});
