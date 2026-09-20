import { test, expect } from "@playwright/test";

async function login(page, email) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("DemoPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("student can browse and join daily yoga", async ({ page }) => {
  await login(page, "student@yogastudio.local");
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText(/start your day/i)).toBeVisible();
  await page.getByRole("link", { name: /explore classes/i }).click();
  await expect(page.getByText(/explore classes/i)).toBeVisible();
  await page.goto("/daily-yoga");
  await page.getByRole("button", { name: /join daily yoga/i }).click();
  await expect(page.getByText(/before you begin/i)).toBeVisible();
  await page.getByRole("button", { name: /begin practice/i }).click();
  await expect(page.getByText(/current pose|centering|pause/i).first()).toBeVisible();
});

test("instructor can create a class", async ({ page }) => {
  await login(page, "instructor@yogastudio.local");
  await page.getByRole("link", { name: /create class/i }).first().click();
  await expect(page.getByText(/class information/i)).toBeVisible();
  await page.getByRole("button", { name: /generate class plan/i }).click();
});

test("admin can open admin dashboard", async ({ page }) => {
  await login(page, "admin@yogastudio.local");
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  await page.getByRole("button", { name: "classes" }).click();
});
