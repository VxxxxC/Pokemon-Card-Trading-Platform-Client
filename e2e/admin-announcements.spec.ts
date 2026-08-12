import { createClient } from "@supabase/supabase-js";
import { test, expect, type Browser, type Page } from "@playwright/test";
import type { Database } from "@/types/supabase";

const E2E_TITLE_PREFIX = "E2E_ANNOUNCEMENT_";

function readEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

function hasAdminAuthFixtures(): boolean {
  return Boolean(readEnv("E2E_ADMIN_EMAIL") && readEnv("E2E_ADMIN_PASSWORD"));
}

function createE2eAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function deleteAnnouncementsByTitlePrefix(prefix: string): Promise<void> {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("platform_announcements")
    .select("id, title")
    .ilike("title", `${prefix}%`);

  if (error) {
    throw new Error(`[deleteAnnouncementsByTitlePrefix] ${error.message}`);
  }

  const ids = (data ?? []).map((row) => row.id);
  if (ids.length === 0) {
    return;
  }

  const { error: deleteError } = await admin
    .from("platform_announcements")
    .delete()
    .in("id", ids);

  if (deleteError) {
    throw new Error(`[deleteAnnouncementsByTitlePrefix] ${deleteError.message}`);
  }
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

test.describe("Admin announcements workflow", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const runId = String(Date.now());
  const initialTitle = `${E2E_TITLE_PREFIX}${runId}`;
  const updatedTitle = `${initialTitle}_UPDATED`;

  test.afterAll(async () => {
    await deleteAnnouncementsByTitlePrefix(E2E_TITLE_PREFIX);
  });

  test("admin create/edit and guest homepage modal", async ({
    page,
    browser,
  }: {
    page: Page;
    browser: Browser;
  }) => {
    test.setTimeout(90_000);

    if (!hasAdminAuthFixtures()) {
      test.skip(true, "Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");
    }

    await loginAsAdmin(page);
    await page.goto("/admin/announcements");
    await expect(page.getByText("載入公告中…")).toHaveCount(0, {
      timeout: 20_000,
    });

    await page
      .getByPlaceholder("請輸入吸引人的活動或公告標題...")
      .fill(initialTitle);
    await page
      .getByPlaceholder("請輸入公告詳細說明、活動辦法、限制條件等...")
      .fill("E2E announcement body for automated workflow verification.");
    await page
      .getByPlaceholder("例如: /catalog 或 https://...")
      .fill("/catalog");

    await page.getByRole("button", { name: "新增公告" }).click();
    await expect(page.getByText("已成功新增公告！")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(initialTitle)).toBeVisible();

    const row = page.locator("div", { hasText: initialTitle }).first();
    await row.getByRole("button", { name: "編輯" }).click();
    await page
      .getByPlaceholder("請輸入吸引人的活動或公告標題...")
      .fill(updatedTitle);
    await page.getByRole("button", { name: "儲存變更" }).click();
    await expect(page.getByText("已成功更新公告！")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(updatedTitle)).toBeVisible();

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.addInitScript(() => {
      sessionStorage.removeItem("hasSeenAnnouncementsModal");
    });
    await guestPage.goto("/");
    const dialog = guestPage.getByRole("dialog");
    await expect(dialog).toContainText(updatedTitle, {
      timeout: 5_000,
    });

    const announcementSlide = dialog
      .locator("div")
      .filter({ hasText: updatedTitle })
      .first();
    const detailLink = announcementSlide.getByRole("link", {
      name: "查看詳情",
    });
    await expect(detailLink).toBeVisible();
    await detailLink.click();
    await guestPage.waitForURL((url) => url.pathname.includes("/catalog"), {
      timeout: 10_000,
    });

    await guestContext.close();
  });
});
