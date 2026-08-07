import {
  listAdminRewardActivities,
  setAdminRewardActivityStatus,
} from "@/app/actions/admin-reward-activities";
import { runAsAdmin } from "../../shared/auth-context";
import { createServiceRoleClient } from "../../shared/supabase-admin";

async function listTemplateIdsByTitlePrefix(
  titlePrefix: string,
): Promise<string[]> {
  return runAsAdmin(async () => {
    const list = await listAdminRewardActivities({
      status: "all",
      pageSize: 200,
    });
    if (!list.success) {
      throw new Error(`[cleanupTemplatesByTitlePrefix] ${list.error}`);
    }

    return list.data.rows
      .filter((row) => row.title.startsWith(titlePrefix))
      .map((row) => row.activity_id);
  });
}

export async function cleanupTemplatesByTitlePrefix(
  titlePrefix: string,
): Promise<void> {
  const templateIds = await listTemplateIdsByTitlePrefix(titlePrefix);
  if (templateIds.length === 0) {
    return;
  }

  await runAsAdmin(async () => {
    const list = await listAdminRewardActivities({
      status: "all",
      pageSize: 200,
    });
    if (!list.success) {
      throw new Error(`[cleanupTemplatesByTitlePrefix] ${list.error}`);
    }

    for (const row of list.data.rows) {
      if (!row.title.startsWith(titlePrefix)) {
        continue;
      }
      if (row.status === "archived") {
        continue;
      }
      const archived = await setAdminRewardActivityStatus(
        row.activity_id,
        "archived",
      );
      if (!archived.success) {
        throw new Error(`[cleanupTemplatesByTitlePrefix] ${archived.error}`);
      }
    }
  });

  const admin = createServiceRoleClient();

  const { error: ledgerError } = await admin
    .from("point_ledger")
    .delete()
    .eq("source_type", "reward_template")
    .in("source_ref", templateIds);
  if (ledgerError) {
    throw new Error(`[cleanupTemplatesByTitlePrefix] ${ledgerError.message}`);
  }
}

export async function resetBuyerProfile(buyerId: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("profiles")
    .update({ completed_trades_count: 0 })
    .eq("id", buyerId);

  if (error) {
    throw new Error(`[resetBuyerProfile] ${error.message}`);
  }
}

export async function cleanupMatrixRun(
  titlePrefix: string,
  buyerId: string,
): Promise<void> {
  await cleanupTemplatesByTitlePrefix(titlePrefix);
  await resetBuyerProfile(buyerId);
}
