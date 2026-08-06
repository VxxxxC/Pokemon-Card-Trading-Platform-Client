import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type RewardsMatrixBootstrap = {
  stamp: number;
  tradeDiscountTitle: string;
  tradeFreeShipTitle: string;
  tradePointsTitle: string;
  lockedProgressTitle: string;
  flashFreeShipTitle: string;
  tradeDiscountTemplateId: string;
  tradeFreeShipTemplateId: string;
  tradePointsTemplateId: string;
  lockedProgressTemplateId: string;
  flashFreeShipTemplateId: string;
  autoGrantUserId: string;
};

const CACHE_PATH = path.resolve(
  process.cwd(),
  "e2e/.cache/rewards-matrix-bootstrap.json",
);

export function readRewardsMatrixBootstrap(): RewardsMatrixBootstrap | null {
  if (!existsSync(CACHE_PATH)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8")) as RewardsMatrixBootstrap;
  } catch {
    return null;
  }
}

export function writeRewardsMatrixBootstrap(
  state: RewardsMatrixBootstrap,
): void {
  mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(state, null, 2), "utf8");
}
