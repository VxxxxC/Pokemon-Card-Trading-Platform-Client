/**
 * Dev CLI: advance the latest open auth order (or a given order id) through the mock escrow flow.
 *
 * Usage:
 *   bun run scripts/run-member-auth-mock-flow.ts
 *   bun run scripts/run-member-auth-mock-flow.ts <order-uuid>
 */
import { createAdminClient } from "../lib/supabase/admin";
import {
  findLatestOpenAuthOrderId,
  runMemberAuthMockFlowDev,
} from "../lib/member-order/dev-mock-flow";

async function main() {
  const orderIdArg = process.argv[2]?.trim();
  const admin = createAdminClient();

  const orderId =
    orderIdArg ?? (await findLatestOpenAuthOrderId(admin)) ?? null;

  if (!orderId) {
    console.error(
      "No open auth order found. Create one first (offer + accept with 鑑定加購), or pass order UUID.",
    );
    process.exit(1);
  }

  console.log(`Running mock flow for order: ${orderId}`);

  const result = await runMemberAuthMockFlowDev(admin, orderId);

  console.log("Steps:", result.stepsRun.join(" → ") || "(none)");
  console.log(
    "Final:",
    `escrow_status=${result.finalEscrowStatus}`,
    `status=${result.finalStatus}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
