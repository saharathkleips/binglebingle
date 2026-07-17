import { test, expect } from "@playwright/test";

test("page loads and displays app title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("빙글빙글");
  await expect(page.getByRole("heading", { name: "빙글빙글" })).toBeVisible();
});
