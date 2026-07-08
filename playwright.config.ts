import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

function loadEnvFile(fileName: string): void {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return;
  }

  for (const rawLine of readFileSync(filePath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "bun run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      timeout: 60_000,
    },
    {
      name: "guest",
      testIgnore: [
        /auth\.setup\.ts/,
        /global-chat-realtime\.spec\.ts/,
        /member-trading-p2p\.spec\.ts/,
        /member-trading-smoke\.spec\.ts/,
        /member-offer-negotiation\.spec\.ts/,
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "buyer",
      testIgnore: [
        /auth\.setup\.ts/,
        /global-chat-realtime\.spec\.ts/,
        /member-trading-p2p\.spec\.ts/,
        /member-offer-negotiation\.spec\.ts/,
        /member-inventory\.spec\.ts/,
      ],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/buyer.json",
      },
    },
    {
      name: "seller",
      testIgnore: [
        /auth\.setup\.ts/,
        /global-chat-realtime\.spec\.ts/,
        /member-trading-p2p\.spec\.ts/,
        /member-offer-negotiation\.spec\.ts/,
      ],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/seller.json",
      },
    },
    {
      name: "chat-realtime",
      testMatch: /global-chat-realtime\.spec\.ts/,
      dependencies: ["setup"],
      timeout: 180_000,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "member-trading",
      testMatch: [
        /member-trading-p2p\.spec\.ts/,
        /member-trading-smoke\.spec\.ts/,
        /member-offer-negotiation\.spec\.ts/,
      ],
      dependencies: ["setup"],
      timeout: 300_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
