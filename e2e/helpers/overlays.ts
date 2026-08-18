import type { Page } from "@playwright/test";

async function clickIfVisible(
  locator: ReturnType<Page["getByRole"]>,
): Promise<boolean> {
  if (await locator.isVisible().catch(() => false)) {
    await locator.click({ force: true, timeout: 3_000 }).catch(() => undefined);
    return true;
  }
  return false;
}

export async function dismissBlockingOverlays(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let dismissed = false;

    const rewardDialog = page.getByRole("dialog", { name: "恭喜解鎖獎勵" });
    if (
      await clickIfVisible(
        rewardDialog.getByRole("button", { name: "太好了" }),
      )
    ) {
      dismissed = true;
    }

    const reportDialog = page.getByRole("alertdialog", {
      name: "舉報結果通知",
    });
    if (
      await clickIfVisible(
        reportDialog.getByRole("button", { name: "我知道了" }),
      )
    ) {
      dismissed = true;
    }

    if (await page.getByText("安裝方法").isVisible().catch(() => false)) {
      const safariInstallClose = page
        .locator("button")
        .filter({ hasText: "✕" })
        .first();
      if (await clickIfVisible(safariInstallClose)) {
        dismissed = true;
      }
    }

    if (await clickIfVisible(page.getByRole("button", { name: "關閉視窗" }))) {
      dismissed = true;
    }

    const pwaClose = page.getByRole("button", { name: "✕" }).first();
    if (await clickIfVisible(pwaClose)) {
      dismissed = true;
    }

    const chatConsole = page.locator('[data-chat-console="true"].fixed.bottom-6');
    if (await chatConsole.isVisible().catch(() => false)) {
      const chatClose = chatConsole.locator("button").filter({ hasText: "✕" }).first();
      if (await clickIfVisible(chatClose)) {
        dismissed = true;
      }
    }

    if (!dismissed) {
      await page.keyboard.press("Escape").catch(() => undefined);
      break;
    }

    await page.waitForTimeout(300);
  }
}
