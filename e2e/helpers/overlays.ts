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

export async function suppressTransientHomeOverlays(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem("hasSeenAnnouncementsModal", "true");
    localStorage.setItem(
      "pwa_snooze_until",
      String(Date.now() + 3 * 24 * 60 * 60 * 1000),
    );
  });
}

export async function waitUntilNoBlockingOverlay(page: Page): Promise<void> {
  await page.waitForTimeout(700);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await dismissBlockingOverlays(page);
    const overlayVisible = await page
      .locator("div.fixed.inset-0.z-\\[400\\]")
      .first()
      .isVisible()
      .catch(() => false);
    const announcementOpen =
      (await page
        .getByRole("dialog", { name: "最新活動與公告" })
        .count()
        .catch(() => 0)) > 0;
    if (!overlayVisible && !announcementOpen) {
      return;
    }
    await page.waitForTimeout(300);
  }
}

export async function dismissBlockingOverlays(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let dismissed = false;

    const announcementDialog = page.getByRole("dialog", {
      name: "最新活動與公告",
    });
    if (
      await clickIfVisible(
        announcementDialog.getByRole("button", { name: "關閉視窗" }),
      )
    ) {
      dismissed = true;
    } else if (
      await clickIfVisible(
        announcementDialog.getByRole("button", { name: "Close" }),
      )
    ) {
      dismissed = true;
    }

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

    const pwaInstallModal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "安裝方法" })
      .first();
    if (await pwaInstallModal.isVisible().catch(() => false)) {
      const pwaClose = pwaInstallModal.getByRole("button", { name: "✕" });
      if (await clickIfVisible(pwaClose)) {
        dismissed = true;
      } else {
        await pwaInstallModal
          .click({ position: { x: 8, y: 8 }, force: true, timeout: 3_000 })
          .catch(() => undefined);
        dismissed = true;
      }
    }

    const blockingOverlay = page.locator("div.fixed.inset-0.z-\\[400\\]").first();
    if (await blockingOverlay.isVisible().catch(() => false)) {
      const backdrop = blockingOverlay.locator("div.absolute.inset-0").first();
      if (await backdrop.isVisible().catch(() => false)) {
        await backdrop
          .click({ force: true, timeout: 3_000 })
          .catch(() => undefined);
        dismissed = true;
      }
      await page.keyboard.press("Escape").catch(() => undefined);
      const overlayClose = blockingOverlay.getByRole("button", {
        name: /✕|關閉視窗|Close/,
      });
      if (await clickIfVisible(overlayClose)) {
        dismissed = true;
      }
    }

    if (await clickIfVisible(page.getByRole("button", { name: "關閉視窗" }))) {
      dismissed = true;
    }

    const chatOpen = await page
      .locator('[data-chat-console="true"]')
      .last()
      .isVisible()
      .catch(() => false);

    if (!dismissed) {
      if (!chatOpen) {
        await page.keyboard.press("Escape").catch(() => undefined);
      }
      break;
    }

    await page.waitForTimeout(300);
  }
}
