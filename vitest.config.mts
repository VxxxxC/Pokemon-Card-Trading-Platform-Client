import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const VALID_SUITES = ["unit", "integration", "mutation"] as const;
type Suite = (typeof VALID_SUITES)[number];

function resolveSuite(): Suite {
  const raw = process.env.VITEST_SUITE ?? "unit";
  if (!VALID_SUITES.includes(raw as Suite)) {
    throw new Error(
      `[vitest.config.mts] 非法 VITEST_SUITE="${raw}"，僅接受 ${VALID_SUITES.join(" | ")}`,
    );
  }
  return raw as Suite;
}

export default defineConfig(({ mode }) => {
  const suite = resolveSuite();

  const alias = {
    "@": rootDir,
  };

  if (suite === "unit") {
    return {
      resolve: { alias },
      test: {
        environment: "node",
        globals: false,
        isolate: true,
        mockReset: true,
        restoreMocks: true,
        include: ["tests/unit/**/*.test.ts"],
      },
    };
  }

  // integration / mutation 皆需要注入 .env 及 integration setup（供 server-only / next.js API mock）
  const env = loadEnv(mode, rootDir, "");
  Object.assign(process.env, env);

  if (suite === "mutation") {
    return {
      resolve: { alias },
      test: {
        environment: "node",
        setupFiles: ["tests/integration/shared/vitest.setup.ts"],
        include: ["tests/integration/rewards/coupon-pbt.integration.test.ts"],
        fileParallelism: false,
        testTimeout: 120_000,
        hookTimeout: 120_000,
        env: {
          COUPON_PBT_NUM_RUNS: "25",
        },
      },
    };
  }

  // suite === "integration"
  return {
    resolve: { alias },
    test: {
      environment: "node",
      setupFiles: ["tests/integration/shared/vitest.setup.ts"],
      include: ["tests/integration/**/*.integration.test.ts"],
      fileParallelism: false,
      testTimeout: 120_000,
      hookTimeout: 120_000,
    },
  };
});
