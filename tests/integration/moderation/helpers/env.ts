import {
  getIntegrationEnv,
  hasBaseIntegrationEnv,
} from "../../shared/env";

function readEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

export function hasModerationIntegrationEnv(): boolean {
  return Boolean(hasBaseIntegrationEnv() && readEnv("E2E_SELLER_ID"));
}

export function getModerationIntegrationEnv() {
  const base = getIntegrationEnv();
  const sellerId = readEnv("E2E_SELLER_ID");
  if (!sellerId) {
    throw new Error("Missing E2E_SELLER_ID for moderation integration tests");
  }
  return { ...base, sellerId };
}

export function getSellerId(): string {
  return getModerationIntegrationEnv().sellerId;
}
