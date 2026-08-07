"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertAdminCheckInProgram } from "@/app/actions/admin-check-in-program";
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
import { TYPE_LABELS } from "@/lib/admin-rewards/template-form";
import {
  buildDefaultCheckInProgramForm,
  completionRewardValueForType,
  programRowToForm,
} from "@/lib/admin-check-in-program/parse-check-in-program";
import type {
  CheckInCompletionType,
  CheckInProgramRow,
  CheckInProgramUpsertInput,
} from "@/lib/admin-check-in-program/types";
import { cn } from "@/lib/utils";
import {
  blockTitle,
  fieldInput,
  fieldLabel,
  fieldSelect,
  sectionDivider,
  sectionShell,
} from "./admin-form-styles";

type AdminCheckInProgramClientProps = {
  initialRow: CheckInProgramRow | null;
  loadError: string | null;
};

export function AdminCheckInProgramClient({
  initialRow,
  loadError,
}: AdminCheckInProgramClientProps) {
  const [form, setForm] = useState<CheckInProgramUpsertInput>(
    initialRow ? programRowToForm(initialRow) : buildDefaultCheckInProgramForm(),
  );
  const [typeLocked, setTypeLocked] = useState(
    initialRow?.completion_type_locked ?? false,
  );
  const [isPending, startTransition] = useTransition();

  const updateDailyReward = (day: number, value: string) => {
    const points = Number(value);
    setForm((prev) => ({
      ...prev,
      daily_rewards: {
        ...prev.daily_rewards,
        [String(day)]: Number.isFinite(points) ? points : 0,
      },
    }));
  };

  const handleCompletionTypeChange = (type: CheckInCompletionType) => {
    setForm((prev) => ({
      ...prev,
      completion_type: type,
      completion_reward_value: completionRewardValueForType(type),
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await upsertAdminCheckInProgram(form);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setForm(programRowToForm(result.data));
      setTypeLocked(result.data.completion_type_locked);
      toast.success("簽到計劃已儲存");
    });
  };

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-sans text-xl font-bold tracking-tight text-text-primary">
          簽到計劃
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          簽到相關獎勵請在此分頁統一設定：每日積分階梯與簽滿 7 日額外獎勵。
        </p>
      </div>

      <div className={sectionShell}>
        <section className="space-y-3">
          <h2 className={blockTitle}>基本設定</h2>
          <div className="flex items-center gap-3">
            <Label htmlFor="program-active" className={fieldLabel}>
              啟用簽到
            </Label>
            <input
              id="program-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label className={fieldLabel}>簽到週期</Label>
            <p className="font-sans text-[12px] text-text-secondary">
              7 日一輪（MVP 固定）
            </p>
          </div>
        </section>

        <div className={sectionDivider}>
          <section className="space-y-3">
            <h2 className={blockTitle}>每日獎勵（積分）</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
                <div key={day} className="space-y-2">
                  <Label htmlFor={`day-${day}`} className={fieldLabel}>
                    第 {day} 日
                  </Label>
                  <Input
                    id={`day-${day}`}
                    type="number"
                    min={1}
                    value={form.daily_rewards[String(day)] ?? ""}
                    onChange={(e) => updateDailyReward(day, e.target.value)}
                    className={fieldInput}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={sectionDivider}>
          <section className="space-y-3">
            <h2 className={blockTitle}>簽滿 7 日額外獎勵</h2>
            <div className="flex items-center gap-3">
              <Label htmlFor="completion-enabled" className={fieldLabel}>
                啟用簽滿獎勵
              </Label>
              <input
                id="completion-enabled"
                type="checkbox"
                checked={form.completion_enabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    completion_enabled: e.target.checked,
                  }))
                }
              />
            </div>

            {form.completion_enabled ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className={fieldLabel}>獎勵類型</Label>
                  <Select
                    value={form.completion_type}
                    onValueChange={(v) =>
                      handleCompletionTypeChange(v as CheckInCompletionType)
                    }
                    disabled={typeLocked}
                  >
                    <SelectTrigger className={fieldSelect}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">{TYPE_LABELS.points}</SelectItem>
                      <SelectItem value="discount_coupon">
                        {TYPE_LABELS.discount_coupon}
                      </SelectItem>
                      <SelectItem value="free_shipping">
                        {TYPE_LABELS.free_shipping}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {typeLocked ? (
                    <p className="font-mono text-[10px] text-text-disabled">
                      獎勵類型已鎖定（曾啟用過簽滿獎勵後不可更改類型）。
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion-title" className={fieldLabel}>
                    標題
                  </Label>
                  <Input
                    id="completion-title"
                    value={form.completion_title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        completion_title: e.target.value,
                      }))
                    }
                    className={fieldInput}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion-description" className={fieldLabel}>
                    描述
                  </Label>
                  <Input
                    id="completion-description"
                    value={form.completion_description ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        completion_description: e.target.value,
                      }))
                    }
                    className={fieldInput}
                  />
                </div>

                {form.completion_type === "points" ? (
                  <div className="space-y-2">
                    <Label htmlFor="completion-points" className={fieldLabel}>
                      積分
                    </Label>
                    <Input
                      id="completion-points"
                      type="number"
                      min={1}
                      value={Number(form.completion_reward_value.points ?? 0)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          completion_reward_value: {
                            points: Number(e.target.value),
                          },
                        }))
                      }
                      className={fieldInput}
                    />
                  </div>
                ) : null}

                {form.completion_type === "discount_coupon" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="completion-amount" className={fieldLabel}>
                        折扣金額 (HKD)
                      </Label>
                      <Input
                        id="completion-amount"
                        type="number"
                        min={1}
                        value={Number(form.completion_reward_value.amount_hkd ?? 0)}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            completion_reward_value: {
                              ...prev.completion_reward_value,
                              amount_hkd: Number(e.target.value),
                            },
                          }))
                        }
                        className={fieldInput}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="completion-min-spend" className={fieldLabel}>
                        最低消費 (HKD)
                      </Label>
                      <Input
                        id="completion-min-spend"
                        type="number"
                        min={0}
                        value={Number(form.completion_reward_value.min_spend_hkd ?? 0)}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            completion_reward_value: {
                              ...prev.completion_reward_value,
                              min_spend_hkd: Number(e.target.value),
                            },
                          }))
                        }
                        className={fieldInput}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="completion-code-prefix" className={fieldLabel}>
                        券碼前綴（選填）
                      </Label>
                      <Input
                        id="completion-code-prefix"
                        value={String(form.completion_reward_value.code_prefix ?? "")}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            completion_reward_value: {
                              ...prev.completion_reward_value,
                              code_prefix: e.target.value,
                            },
                          }))
                        }
                        className={fieldInput}
                      />
                    </div>
                  </>
                ) : null}

                {form.completion_type === "free_shipping" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="completion-max-subsidy" className={fieldLabel}>
                        免運補貼上限 (HKD)
                      </Label>
                      <Input
                        id="completion-max-subsidy"
                        type="number"
                        min={1}
                        value={Number(form.completion_reward_value.max_subsidy_hkd ?? 0)}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            completion_reward_value: {
                              ...prev.completion_reward_value,
                              max_subsidy_hkd: Number(e.target.value),
                            },
                          }))
                        }
                        className={fieldInput}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="completion-fs-min-spend" className={fieldLabel}>
                        最低消費 (HKD)
                      </Label>
                      <Input
                        id="completion-fs-min-spend"
                        type="number"
                        min={0}
                        value={Number(form.completion_reward_value.min_spend_hkd ?? 0)}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            completion_reward_value: {
                              ...prev.completion_reward_value,
                              min_spend_hkd: Number(e.target.value),
                            },
                          }))
                        }
                        className={fieldInput}
                      />
                    </div>
                  </>
                ) : null}

                {form.completion_type !== "points" ? (
                  <div className="space-y-2">
                    <Label htmlFor="completion-valid-days" className={fieldLabel}>
                      有效天數（選填）
                    </Label>
                    <Input
                      id="completion-valid-days"
                      type="number"
                      min={1}
                      value={form.completion_valid_duration_days ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          completion_valid_duration_days: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                      className={fieldInput}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            <p className="font-mono text-[10px] text-text-disabled">
              修改獎勵面額只影響之後發放；已發放未使用券以結帳時模板設定為準。
            </p>
          </section>
        </div>

        <div className={cn(sectionDivider, "space-y-3")}>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="h-11 w-full rounded-xl bg-brand font-sans text-[12px] font-bold text-[#17130f] shadow-md shadow-brand/10 hover:bg-brand-hover active:scale-[0.98]"
          >
            {isPending ? "儲存中…" : "儲存簽到計劃"}
          </Button>
        </div>
      </div>
    </div>
  );
}
