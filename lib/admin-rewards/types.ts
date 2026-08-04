import type { Database } from "@/types/supabase";

export type AdminRewardTemplateStatus =
  Database["public"]["Enums"]["reward_template_status"];

export type AdminRewardDistributionMode =
  Database["public"]["Enums"]["reward_distribution_mode"];

export type AdminRewardTemplateType = Exclude<
  Database["public"]["Enums"]["reward_type"],
  "lucky_draw_ticket"
>;

export type AdminRewardTriggerKind =
  | "event_once"
  | "trade_count"
  | "check_in_streak"
  | "check_in_cycle_day";

export type AdminRewardEventOnceEvent =
  | "profile_complete"
  | "first_listing"
  | "first_chat";

export type AdminRewardAuthRestriction = "any" | "true" | "false";

export type AdminRewardTemplateRestrictions = {
  order_kinds: ("merchant" | "member")[];
  requires_authentication: AdminRewardAuthRestriction;
  shipping_methods: ("sf" | "meetup")[];
  min_item_subtotal_hkd: number;
};

export type AdminRewardTemplateRow = {
  id: string;
  title: string;
  description: string | null;
  type: AdminRewardTemplateType;
  reward_value: Record<string, unknown>;
  trigger_conditions: Record<string, unknown>;
  is_active: boolean | null;
  is_infinite: boolean | null;
  max_claims: number | null;
  claimed_count: number;
  valid_duration_days: number | null;
  fixed_expiry_date: string | null;
  status: AdminRewardTemplateStatus;
  distribution_mode: AdminRewardDistributionMode;
  restrictions: AdminRewardTemplateRestrictions;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminRewardTemplateUpsertInput = {
  id?: string;
  title: string;
  description?: string | null;
  type: AdminRewardTemplateType;
  reward_value: Record<string, unknown>;
  trigger_conditions: Record<string, unknown>;
  is_infinite: boolean;
  max_claims?: number | null;
  valid_duration_days?: number | null;
  fixed_expiry_date?: string | null;
  distribution_mode?: AdminRewardDistributionMode;
  restrictions?: AdminRewardTemplateRestrictions;
};

export const DEFAULT_ADMIN_REWARD_RESTRICTIONS: AdminRewardTemplateRestrictions =
  {
    order_kinds: ["merchant"],
    requires_authentication: "any",
    shipping_methods: ["sf"],
    min_item_subtotal_hkd: 0,
  };
