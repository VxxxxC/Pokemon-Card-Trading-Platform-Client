import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { UiAssertion, UiRequiredElement } from "@/lib/dev/ui-feature-map";

export async function assertUiSurface(
  page: Page,
  assertions: UiAssertion[],
): Promise<void> {
  for (const assertion of assertions) {
    switch (assertion.type) {
      case "heading": {
        const heading = page.getByRole("heading", {
          name: assertion.name,
          level: assertion.level,
        });
        await expect(heading.first()).toBeVisible({ timeout: 20_000 });
        break;
      }
      case "text": {
        if (!assertion.pattern) {
          throw new Error("text assertion requires pattern");
        }
        await expect(page.getByText(new RegExp(assertion.pattern)).first()).toBeVisible({
          timeout: 20_000,
        });
        break;
      }
      case "locator": {
        if (!assertion.name) {
          throw new Error("locator assertion requires name");
        }
        await expect(page.locator(assertion.name).first()).toBeVisible({
          timeout: 20_000,
        });
        break;
      }
      default:
        throw new Error(`Unknown assertion type`);
    }
  }
}

function resolveElementName(element: UiRequiredElement): string | RegExp {
  if (element.pattern) {
    return new RegExp(element.pattern);
  }
  if (!element.name) {
    throw new Error(`element ${element.id} requires name or pattern`);
  }
  return element.name;
}

export async function assertRequiredElements(
  page: Page,
  elements: UiRequiredElement[],
): Promise<void> {
  for (const element of elements) {
    if (element.locator) {
      const target = page.locator(element.locator).first();
      if (element.optional) {
        if ((await target.count()) === 0) continue;
      }
      await expect(target).toBeVisible({ timeout: 20_000 });
      continue;
    }

    const name = resolveElementName(element);
    let target;
    switch (element.role) {
      case "text":
        target = page.getByText(name).first();
        break;
      case "heading":
        target = page.getByRole("heading", { name }).first();
        break;
      case "tab":
        target = page.getByRole("tab", { name }).first();
        break;
      default:
        target = page.getByRole(element.role, { name }).first();
        break;
    }

    if (element.optional) {
      if ((await target.count()) === 0) continue;
    }
    await expect(target).toBeVisible({ timeout: 20_000 });
  }
}

export function projectMatchesSurfaceRole(
  projectName: string,
  role: "guest" | "buyer" | "seller" | "admin",
): boolean {
  if (role === "guest") return projectName === "guest";
  if (role === "buyer") return projectName === "buyer";
  if (role === "seller") return projectName === "seller";
  if (role === "admin") return projectName === "buyer";
  return false;
}
