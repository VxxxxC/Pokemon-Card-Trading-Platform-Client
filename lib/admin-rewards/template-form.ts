import {
  DEFAULT_ADMIN_REWARD_RESTRICTIONS,
  type AdminRewardTemplateRow,
  type AdminRewardTemplateStatus,
  type AdminRewardTemplateType,
  type AdminRewardTemplateUpsertInput,
} from "@/lib/admin-rewards/types";

export const TYPE_LABELS: Record<AdminRewardTemplateType, string> = {
  points: "積分",
  discount_coupon: "折扣券",
  free_shipping: "免運券",
};

export const STATUS_LABELS: Record<AdminRewardTemplateStatus, string> = {
  draft: "草稿",
  active: "已發布",
  archived: "已封存",
};

export function buildDefaultForm(): AdminRewardTemplateUpsertInput {
  return {
    title: "",
    description: "",
    type: "discount_coupon",
    reward_value: { amount_hkd: 10, min_spend_hkd: 100 },
    trigger_conditions: {
      kind: "event_once",
      event: "profile_complete",
      once_per_user: true,
    },
    is_infinite: true,
    max_claims: null,
    valid_duration_days: 30,
    fixed_expiry_date: null,
    distribution_mode: "auto_grant",
    restrictions: { ...DEFAULT_ADMIN_REWARD_RESTRICTIONS },
  };
}

export function rowToForm(
  row: AdminRewardTemplateRow,
): AdminRewardTemplateUpsertInput {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    reward_value: row.reward_value,
    trigger_conditions: row.trigger_conditions,
    is_infinite: row.is_infinite ?? true,
    max_claims: row.max_claims,
    valid_duration_days: row.valid_duration_days,
    fixed_expiry_date: row.fixed_expiry_date,
    distribution_mode: row.distribution_mode,
    restrictions: row.restrictions,
  };
}

export function formatStock(row: AdminRewardTemplateRow): string {
  if (row.is_infinite) {
    return "無限";
  }
  return `${row.claimed_count} / ${row.max_claims ?? 0}`;
}

export function rewardValueForType(
  type: AdminRewardTemplateType,
): Record<string, unknown> {
  if (type === "points") {
    return { points: 100 };
  }
  if (type === "discount_coupon") {
    return { amount_hkd: 10, min_spend_hkd: 100 };
  }
  return { max_subsidy_hkd: 30, min_spend_hkd: 0 };
}
