"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  setAdminRewardActivityStatus,
  upsertAdminRewardActivity,
} from "@/app/actions/admin-reward-activities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildDefaultActivityForm,
  buildDefaultFlashSchedule,
  DISTRIBUTION_MODE_LABELS,
  rewardValueForType,
} from "@/lib/admin-rewards/template-form";
import type {
  AdminRewardActivityUpsertInput,
  AdminRewardDistributionMode,
  AdminRewardEventOnceEvent,
  AdminRewardTemplateType,
  AdminRewardTriggerKind,
} from "@/lib/admin-rewards/types";
import { DEFAULT_ADMIN_REWARD_RESTRICTIONS } from "@/lib/admin-rewards/types";
import { cn } from "@/lib/utils";
import {
  blockTitle,
  fieldInput,
  fieldLabel,
  fieldSelect,
  sectionDivider,
  sectionShell,
} from "./admin-form-styles";

type RewardActivityFormProps = {
  initialForm?: AdminRewardActivityUpsertInput;
};

function localDateTimeToIso(value: string): string {
  if (!value.trim()) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString();
}

function validateFlashSchedule(form: AdminRewardActivityUpsertInput): string | null {
  const schedule = form.schedule ?? form.flash_schedule;
  if (!schedule) {
    return "請設定搶券檔期";
  }
  if (!schedule.starts_at || !schedule.ends_at) {
    return "請設定活動開始與結束時間";
  }
  const startsAt = localDateTimeToIso(schedule.starts_at);
  const endsAt = localDateTimeToIso(schedule.ends_at);
  if (!startsAt || !endsAt) {
    return "活動時間格式無效";
  }
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return "活動結束時間必須晚於開始時間";
  }
  if (schedule.max_claims <= 0) {
    return "場次庫存必須大於 0";
  }
  if (schedule.max_claims_per_user <= 0) {
    return "每人限搶必須大於 0";
  }
  return null;
}

function validateAutoGrantSchedule(
  form: AdminRewardActivityUpsertInput,
): string | null {
  const schedule = form.schedule ?? form.flash_schedule;
  const hasStart = Boolean(schedule?.starts_at?.trim());
  const hasEnd = Boolean(schedule?.ends_at?.trim());
  if (!hasStart && !hasEnd) {
    return null;
  }
  if (!hasStart || !hasEnd) {
    return "請同時設定活動開始與結束時間，或留空表示不限期";
  }
  const startsAt = localDateTimeToIso(schedule!.starts_at);
  const endsAt = localDateTimeToIso(schedule!.ends_at);
  if (!startsAt || !endsAt) {
    return "活動時間格式無效";
  }
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return "活動結束時間必須晚於開始時間";
  }
  return null;
}

export function RewardActivityForm({ initialForm }: RewardActivityFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<AdminRewardActivityUpsertInput>(
    initialForm ?? buildDefaultActivityForm(),
  );
  const [isPending, startTransition] = useTransition();

  const mode = form.distribution_mode ?? "auto_grant";
  const triggerKind = (form.trigger_conditions.kind ??
    "event_once") as AdminRewardTriggerKind;
  const isLegacyCheckInTrigger =
    triggerKind === "check_in_streak" || triggerKind === "check_in_cycle_day";
  const schedule = form.schedule ?? form.flash_schedule;

  const ensureFlashSchedule = (
    next: AdminRewardActivityUpsertInput,
  ): AdminRewardActivityUpsertInput => {
    if (next.distribution_mode === "flash_only" && !next.schedule && !next.flash_schedule) {
      const defaults = buildDefaultFlashSchedule();
      return {
        ...next,
        trigger_conditions: { kind: "none" },
        schedule: {
          ...defaults,
          name: next.title || defaults.campaign_name,
          campaign_name: next.title || defaults.campaign_name,
        },
        flash_schedule: {
          ...defaults,
          campaign_name: next.title || defaults.campaign_name,
        },
      };
    }
    return next;
  };

  const handleChange = (next: AdminRewardActivityUpsertInput) => {
    setForm(ensureFlashSchedule(next));
  };

  const handleDistributionChange = (value: AdminRewardDistributionMode) => {
    if (value === "flash_only") {
      handleChange({
        ...form,
        distribution_mode: value,
        trigger_conditions: { kind: "none" },
        schedule: schedule ?? {
          ...buildDefaultFlashSchedule(),
          name: form.title,
          campaign_name: form.title,
        },
      });
      return;
    }

    handleChange({
      ...form,
      distribution_mode: value,
      trigger_conditions:
        form.trigger_conditions.kind === "none"
          ? {
              kind: "event_once",
              event: "profile_complete",
              once_per_user: true,
            }
          : form.trigger_conditions,
      schedule: undefined,
      flash_schedule: undefined,
    });
  };

  const updateTrigger = (patch: Record<string, unknown>) => {
    handleChange({
      ...form,
      trigger_conditions: { ...form.trigger_conditions, ...patch },
    });
  };

  const updateSchedule = (patch: Record<string, unknown>) => {
    const current = schedule ?? buildDefaultFlashSchedule();
    const nextSchedule = { ...current, ...patch };
    handleChange({
      ...form,
      schedule: nextSchedule,
      flash_schedule: {
        campaign_id: nextSchedule.campaign_id,
        campaign_name:
          (nextSchedule.campaign_name as string | undefined) ??
          form.title,
        starts_at: nextSchedule.starts_at,
        ends_at: nextSchedule.ends_at,
        max_claims: nextSchedule.max_claims,
        max_claims_per_user: nextSchedule.max_claims_per_user,
        override_valid_days: nextSchedule.override_valid_days,
      },
    });
  };

  const saveDraft = () => {
    if (isLegacyCheckInTrigger) {
      return;
    }

    if (mode === "auto_grant") {
      const scheduleError = validateAutoGrantSchedule(form);
      if (scheduleError) {
        toast.error(scheduleError);
        return;
      }
    }

    startTransition(async () => {
      const result = await upsertAdminRewardActivity(form);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(form.id ? "已更新草稿" : "已建立草稿");
      if (!form.id) {
        router.replace(`/admin/campaigns/${result.data.activityId}`);
      }
      setForm((current) => ({ ...current, id: result.data.activityId }));
    });
  };

  const publish = () => {
    if (isLegacyCheckInTrigger) {
      return;
    }

    if (mode === "flash_only") {
      const scheduleError = validateFlashSchedule(form);
      if (scheduleError) {
        toast.error(scheduleError);
        return;
      }
    }
    if (mode === "auto_grant") {
      const scheduleError = validateAutoGrantSchedule(form);
      if (scheduleError) {
        toast.error(scheduleError);
        return;
      }
    }

    startTransition(async () => {
      const saveResult = await upsertAdminRewardActivity(form);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const activityId = saveResult.data.activityId;
      const publishResult = await setAdminRewardActivityStatus(
        activityId,
        "active",
      );
      if (!publishResult.success) {
        toast.error(publishResult.error);
        return;
      }

      toast.success("已發布獎勵活動");
      router.push("/admin/campaigns");
      router.refresh();
    });
  };

  const eventOnceEvent = String(
    form.trigger_conditions.event ?? "profile_complete",
  );

  return (
    <div className="space-y-8">
      {isLegacyCheckInTrigger ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-text-primary">
          此簽到獎勵已遷移至「簽到計劃」分頁；此活動已封存，無法編輯。
        </div>
      ) : null}

      <div className={sectionShell}>
        {/* 1. 基本資料 */}
        <section className="space-y-3">
          <h2 className={blockTitle}>基本資料</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="activity-title" className={fieldLabel}>
                活動名稱 <span className="text-warning">*</span>
              </Label>
              <Input
                id="template-title"
                value={form.title}
                onChange={(event) =>
                  handleChange({ ...form, title: event.target.value })
                }
                className={fieldInput}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-description" className={fieldLabel}>
                描述
              </Label>
              <Input
                id="activity-description"
                value={form.description ?? ""}
                onChange={(event) =>
                  handleChange({ ...form, description: event.target.value })
                }
                className={fieldInput}
              />
            </div>
          </div>
        </section>

        {/* 2. 使用限制與有效期 */}
        <div className={sectionDivider}>
          <section className="space-y-3">
            <h2 className={blockTitle}>使用限制與有效期</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className={fieldLabel}>適用鑑定</Label>
                <Select
                  value={form.restrictions?.requires_authentication ?? "any"}
                  onValueChange={(value) =>
                    handleChange({
                      ...form,
                      restrictions: {
                        ...(form.restrictions ?? DEFAULT_ADMIN_REWARD_RESTRICTIONS),
                        requires_authentication: value as "any" | "true" | "false",
                      },
                    })
                  }
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">全部訂單</SelectItem>
                    <SelectItem value="true">僅鑑定單</SelectItem>
                    <SelectItem value="false">僅非鑑定單</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {mode === "auto_grant" ? (
                <div className="space-y-2">
                  <Label htmlFor="valid-days" className={fieldLabel}>
                    領取後有效天數
                  </Label>
                  <Input
                    id="valid-days"
                    type="number"
                    value={String(form.valid_duration_days ?? "")}
                    onChange={(event) =>
                      handleChange({
                        ...form,
                        valid_duration_days: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                    className={fieldInput}
                  />
                </div>
              ) : null}
              {mode === "auto_grant" ? (
                <div className="space-y-2">
                  <Label htmlFor="max-claims" className={fieldLabel}>
                    限量（空白=無限）
                  </Label>
                  <Input
                    id="max-claims"
                    type="number"
                    value={form.is_infinite ? "" : String(form.max_claims ?? "")}
                    onChange={(event) => {
                      const raw = event.target.value.trim();
                      if (!raw) {
                        handleChange({
                          ...form,
                          is_infinite: true,
                          max_claims: null,
                        });
                        return;
                      }
                      handleChange({
                        ...form,
                        is_infinite: false,
                        max_claims: Number(raw),
                      });
                    }}
                    className={fieldInput}
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>

        {/* 3. 發放方式 */}
        <div className={sectionDivider}>
          <section className="space-y-3">
            <h2 className={blockTitle}>發放方式</h2>
            <Select
              value={mode}
              onValueChange={(value) => {
                if (value) {
                  handleDistributionChange(value);
                }
              }}
            >
              <SelectTrigger className={cn(fieldSelect, "max-w-md")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto_grant">
                  {DISTRIBUTION_MODE_LABELS.auto_grant}
                </SelectItem>
                <SelectItem value="flash_only">
                  {DISTRIBUTION_MODE_LABELS.flash_only}
                </SelectItem>
              </SelectContent>
            </Select>
            {mode === "flash_only" ? (
              <p className="font-sans text-[12px] text-amber-200">
                用戶於活動期內主動搶領，先到先得，無需觸發條件。
              </p>
            ) : (
              <p className="font-sans text-[12px] text-text-secondary">
                用戶滿足觸發條件後，系統自動發放入錢包。
              </p>
            )}
          </section>
        </div>

        {/* 4. 觸發條件 */}
        {mode === "auto_grant" ? (
          <div className={sectionDivider}>
            <section className="space-y-3">
              <h2 className={blockTitle}>觸發條件</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={fieldLabel}>條件類型</Label>
                  <Select
                    value={triggerKind}
                    onValueChange={(value) => {
                      const kind = value as AdminRewardTriggerKind;
                      if (kind === "event_once") {
                        updateTrigger({
                          kind,
                          event: "profile_complete",
                          once_per_user: true,
                        });
                      } else {
                        updateTrigger({
                          kind: "trade_count",
                          role: "buyer",
                          count: 1,
                          once_per_user: true,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className={fieldSelect}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_once">一次性事件</SelectItem>
                      <SelectItem value="trade_count">成交筆數</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {triggerKind === "event_once" ? (
                  <div className="space-y-2">
                    <Label className={fieldLabel}>事件</Label>
                    <Select
                      value={String(form.trigger_conditions.event ?? "profile_complete")}
                      onValueChange={(value) =>
                        updateTrigger({
                          event: value as AdminRewardEventOnceEvent,
                          once_per_user: true,
                        })
                      }
                    >
                      <SelectTrigger className={fieldSelect}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profile_complete">完善個人資料</SelectItem>
                        <SelectItem value="first_listing">首次上架</SelectItem>
                        <SelectItem value="first_chat">首次聊天</SelectItem>
                        <SelectItem value="account_registered">註冊完成</SelectItem>
                      </SelectContent>
                    </Select>
                    {eventOnceEvent === "account_registered" ? (
                      <p className="font-sans text-[12px] text-text-secondary">
                        {schedule?.starts_at && schedule?.ends_at
                          ? "僅活動開始後完成註冊的用戶可領（以帳戶建立時間為準，非首次登入）"
                          : "未設定活動期限時以模板建立時間為準；建議註冊券設定開始時間。非首次登入。"}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {triggerKind === "trade_count" ? (
                  <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
                    <div className="space-y-2">
                      <Label className={fieldLabel}>角色</Label>
                      <Select
                        value={String(form.trigger_conditions.role ?? "buyer")}
                        onValueChange={(value) =>
                          updateTrigger({ role: value, once_per_user: true })
                        }
                      >
                        <SelectTrigger className={fieldSelect}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buyer">買家</SelectItem>
                          <SelectItem value="merchant">商戶</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trade-count" className={fieldLabel}>
                        筆數
                      </Label>
                      <Input
                        id="trade-count"
                        type="number"
                        value={String(form.trigger_conditions.count ?? 1)}
                        onChange={(event) =>
                          updateTrigger({
                            count: Number(event.target.value),
                            once_per_user: true,
                          })
                        }
                        className={fieldInput}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {/* 5. 獎勵內容 */}
        <div className={sectionDivider}>
          <section className="space-y-3">
            <h2 className={blockTitle}>獎勵內容</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className={fieldLabel}>
                  類型 <span className="text-warning">*</span>
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    handleChange({
                      ...form,
                      type: value as AdminRewardTemplateType,
                      reward_value: rewardValueForType(value as AdminRewardTemplateType),
                    })
                  }
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">積分</SelectItem>
                    <SelectItem value="discount_coupon">折扣券</SelectItem>
                    <SelectItem value="free_shipping">免運券</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.type === "points" ? (
                <div className="space-y-2">
                  <Label htmlFor="reward-points" className={fieldLabel}>
                    積分數
                  </Label>
                  <Input
                    id="reward-points"
                    type="number"
                    value={String(form.reward_value.points ?? 0)}
                    onChange={(event) =>
                      handleChange({
                        ...form,
                        reward_value: {
                          ...form.reward_value,
                          points: Number(event.target.value),
                        },
                      })
                    }
                    className={fieldInput}
                  />
                </div>
              ) : null}

              {form.type === "discount_coupon" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reward-amount" className={fieldLabel}>
                      折扣金額 (HK$)
                    </Label>
                    <Input
                      id="reward-amount"
                      type="number"
                      value={String(form.reward_value.amount_hkd ?? 0)}
                      onChange={(event) =>
                        handleChange({
                          ...form,
                          reward_value: {
                            ...form.reward_value,
                            amount_hkd: Number(event.target.value),
                          },
                        })
                      }
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reward-min-spend" className={fieldLabel}>
                      最低消費 (HK$)
                    </Label>
                    <Input
                      id="reward-min-spend"
                      type="number"
                      value={String(form.reward_value.min_spend_hkd ?? 0)}
                      onChange={(event) =>
                        handleChange({
                          ...form,
                          reward_value: {
                            ...form.reward_value,
                            min_spend_hkd: Number(event.target.value),
                          },
                        })
                      }
                      className={fieldInput}
                    />
                  </div>
                </>
              ) : null}

              {form.type === "free_shipping" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reward-max-subsidy" className={fieldLabel}>
                      平台補貼上限 (HK$)
                    </Label>
                    <Input
                      id="reward-max-subsidy"
                      type="number"
                      value={String(form.reward_value.max_subsidy_hkd ?? 0)}
                      onChange={(event) =>
                        handleChange({
                          ...form,
                          reward_value: {
                            ...form.reward_value,
                            max_subsidy_hkd: Number(event.target.value),
                          },
                        })
                      }
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reward-shipping-min" className={fieldLabel}>
                      最低消費 (HK$)
                    </Label>
                    <Input
                      id="reward-shipping-min"
                      type="number"
                      value={String(form.reward_value.min_spend_hkd ?? 0)}
                      onChange={(event) =>
                        handleChange({
                          ...form,
                          reward_value: {
                            ...form.reward_value,
                            min_spend_hkd: Number(event.target.value),
                          },
                        })
                      }
                      className={fieldInput}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </section>
        </div>

        {/* 6. 活動期限 / 搶券檔期 */}
        {mode === "auto_grant" ? (
          <div className={sectionDivider}>
            <section className="space-y-3">
              <h2 className={blockTitle}>活動期限</h2>
              <p className="font-sans text-[12px] text-text-secondary">
                可選。不設定則發布後持續有效，直至封存或模板庫存用盡。
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="auto-grant-starts" className={fieldLabel}>
                    開始時間
                  </Label>
                  <Input
                    id="auto-grant-starts"
                    type="datetime-local"
                    value={schedule?.starts_at ?? ""}
                    onChange={(event) =>
                      updateSchedule({ starts_at: event.target.value })
                    }
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-grant-ends" className={fieldLabel}>
                    結束時間
                  </Label>
                  <Input
                    id="auto-grant-ends"
                    type="datetime-local"
                    value={schedule?.ends_at ?? ""}
                    onChange={(event) =>
                      updateSchedule({ ends_at: event.target.value })
                    }
                    className={fieldInput}
                  />
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {mode === "flash_only" && schedule ? (
          <div className={sectionDivider}>
            <section className="space-y-3">
              <h2 className={blockTitle}>搶券檔期</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-starts" className={fieldLabel}>
                    開始時間
                  </Label>
                  <Input
                    id="campaign-starts"
                    type="datetime-local"
                    value={schedule.starts_at}
                    onChange={(event) =>
                      updateSchedule({ starts_at: event.target.value })
                    }
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-ends" className={fieldLabel}>
                    結束時間
                  </Label>
                  <Input
                    id="campaign-ends"
                    type="datetime-local"
                    value={schedule.ends_at}
                    onChange={(event) =>
                      updateSchedule({ ends_at: event.target.value })
                    }
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-stock" className={fieldLabel}>
                    場次庫存
                  </Label>
                  <Input
                    id="campaign-stock"
                    type="number"
                    min={1}
                    value={String(schedule.max_claims)}
                    onChange={(event) =>
                      updateSchedule({ max_claims: Number(event.target.value || 0) })
                    }
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-per-user" className={fieldLabel}>
                    每人限搶
                  </Label>
                  <Input
                    id="campaign-per-user"
                    type="number"
                    min={1}
                    value={String(schedule.max_claims_per_user)}
                    onChange={(event) =>
                      updateSchedule({
                        max_claims_per_user: Number(event.target.value || 1),
                      })
                    }
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-valid-days" className={fieldLabel}>
                    領取後有效天數（可選）
                  </Label>
                  <Input
                    id="schedule-valid-days"
                    type="number"
                    value={
                      schedule.override_valid_days == null
                        ? ""
                        : String(schedule.override_valid_days)
                    }
                    onChange={(event) => {
                      const raw = event.target.value.trim();
                      updateSchedule({
                        override_valid_days: raw ? Number(raw) : null,
                      });
                    }}
                    className={fieldInput}
                  />
                  <p className="font-mono text-[10px] text-text-disabled">
                    留空則使用模板預設有效期。
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {/* 底部操作列 */}
        <div className={cn(sectionDivider, "space-y-3")}>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={isPending || isLegacyCheckInTrigger}
              className="h-9 rounded-xl border-[rgba(237,232,224,0.12)] bg-transparent font-sans text-[12px] text-text-secondary hover:text-text-primary"
            >
              儲存草稿
            </Button>
            <Link
              href="/admin/campaigns"
              className="inline-flex h-9 items-center justify-center rounded-xl px-4 font-sans text-[12px] text-text-secondary hover:text-text-primary"
            >
              返回列表
            </Link>
          </div>
          <Button
            type="button"
            onClick={publish}
            disabled={isPending || isLegacyCheckInTrigger}
            className="h-11 w-full rounded-xl bg-brand font-sans text-[12px] font-bold text-[#17130f] shadow-md shadow-brand/10 hover:bg-brand-hover active:scale-[0.98]"
          >
            發布
          </Button>
        </div>
      </div>
    </div>
  );
}
