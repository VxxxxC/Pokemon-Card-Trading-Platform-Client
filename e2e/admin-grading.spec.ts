import { test, expect, type Page } from "@playwright/test";

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function hasAdminAuthFixtures(): boolean {
  return Boolean(readEnv("E2E_ADMIN_EMAIL") && readEnv("E2E_ADMIN_PASSWORD"));
}

async function loginAsAdmin(page: Page): Promise<void> {
  const email = readEnv("E2E_ADMIN_EMAIL");
  const password = readEnv("E2E_ADMIN_PASSWORD");
  if (!email || !password) {
    throw new Error("Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");
  }

  await page.goto("/auth");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 20_000,
  });
}

test.describe("Admin grading workbench smoke", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(90_000);

  test("admin opens grading queue with awaiting intake tab", async (
    { page },
    testInfo,
  ) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only: admin logs in via /auth");
    test.skip(!hasAdminAuthFixtures(), "Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");

    await loginAsAdmin(page);
    await page.goto("/admin/grading", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "鑑定工作台" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "待入庫" })).toBeVisible();
    await expect(page.getByRole("button", { name: "鑑定中" })).toBeVisible();
  });
});
