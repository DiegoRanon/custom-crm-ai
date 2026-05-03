import { test, expect } from "@playwright/test";

test("login page renders with sign-in form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
