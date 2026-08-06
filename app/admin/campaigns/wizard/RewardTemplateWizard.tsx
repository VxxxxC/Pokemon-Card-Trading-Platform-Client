"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  setAdminRewardTemplateStatus,
  upsertAdminRewardTemplate,
} from "@/app/actions/admin-rewards";
import { upsertAdminRewardCampaign } from "@/app/actions/admin-reward-campaigns";
import { RewardCampaignScheduleStep } from "@/app/admin/campaigns/wizard/RewardCampaignScheduleStep";
import { RewardDistributionStep } from "@/app/admin/campaigns/wizard/RewardDistributionStep";
import { RewardTemplateDefinitionStep } from "@/app/admin/campaigns/wizard/RewardTemplateDefinitionStep";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AdminRewardTemplateRow,
  AdminRewardTemplateUpsertInput,
} from "@/lib/admin-rewards/types";
import {
  buildDefaultFlashSchedule,
  buildDefaultForm,
  rowToForm,
} from "@/lib/admin-rewards/template-form";

type WizardStep = 1 | 2 | 3;

type RewardTemplateWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRow?: AdminRewardTemplateRow | null;
  onSaved: () => void;
};

const STEP_LABELS: Record<WizardStep, string> = {
  1: "獎勵定義",
  2: "發放方式",
  3: "檔期（可選）",
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

function validateFlashSchedule(form: AdminRewardTemplateUpsertInput): string | null {
  const schedule = form.flash_schedule;
  if (!schedule) {
    return "請設定搶券檔期";
  }
  if (!schedule.campaign_name.trim()) {
    return "請填寫活動名稱";
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

export function RewardTemplateWizard({
  open,
  onOpenChange,
  initialRow,
  onSaved,
}: RewardTemplateWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<AdminRewardTemplateUpsertInput>(
    initialRow ? rowToForm(initialRow) : buildDefaultForm(),
  );
  const [isPending, startTransition] = useTransition();

  const resetForOpen = (row: AdminRewardTemplateRow | null | undefined) => {
    setStep(1);
    const nextForm = row ? rowToForm(row) : buildDefaultForm();
    if (nextForm.distribution_mode === "flash_only" && !nextForm.flash_schedule) {
      nextForm.flash_schedule = {
        ...buildDefaultFlashSchedule(),
        campaign_name: nextForm.title || "",
      };
    }
    setForm(nextForm);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      resetForOpen(initialRow);
    }
    onOpenChange(next);
  };

  const handleFormChange = (next: AdminRewardTemplateUpsertInput) => {
    if (
      next.distribution_mode === "flash_only" &&
      !next.flash_schedule
    ) {
      next.flash_schedule = {
        ...buildDefaultFlashSchedule(),
        campaign_name: next.title || "",
      };
    }
    setForm(next);
  };

  const handleSaveDraft = () => {
    startTransition(async () => {
      const result = await upsertAdminRewardTemplate(form);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(form.id ? "已更新模板" : "已建立草稿模板");
      setForm(rowToForm(result.data.row));
      onSaved();
    });
  };

  const handlePublish = () => {
    if (form.distribution_mode === "flash_only") {
      const scheduleError = validateFlashSchedule(form);
      if (scheduleError) {
        toast.error(scheduleError);
        return;
      }
    }

    startTransition(async () => {
      const saveResult = await upsertAdminRewardTemplate(form);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const templateId = saveResult.data.templateId;
      const publishResult = await setAdminRewardTemplateStatus(
        templateId,
        "active",
      );
      if (!publishResult.success) {
        toast.error(publishResult.error);
        return;
      }

      if (form.distribution_mode === "flash_only" && form.flash_schedule) {
        const schedule = form.flash_schedule;
        const campaignResult = await upsertAdminRewardCampaign({
          id: schedule.campaign_id,
          template_id: templateId,
          name: schedule.campaign_name.trim(),
          status: "active",
          starts_at: localDateTimeToIso(schedule.starts_at),
          ends_at: localDateTimeToIso(schedule.ends_at),
          max_claims: schedule.max_claims,
          max_claims_per_user: schedule.max_claims_per_user,
          override_valid_days: schedule.override_valid_days,
        });

        if (!campaignResult.success) {
          toast.error(campaignResult.error);
          return;
        }
      }

      toast.success("已發布模板");
      onSaved();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {form.id ? "編輯獎勵模板" : "新增獎勵模板"} — Step {step}/3 ·{" "}
            {STEP_LABELS[step]}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          {([1, 2, 3] as WizardStep[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStep(n)}
              className={`rounded-lg px-3 py-1 text-xs font-medium ${
                step === n
                  ? "bg-brand text-[#17130f]"
                  : "bg-[#26211C] text-[#d4c4b7] border border-white/10"
              }`}
            >
              {STEP_LABELS[n]}
            </button>
          ))}
        </div>

        {step === 1 ? (
          <RewardTemplateDefinitionStep form={form} onChange={handleFormChange} />
        ) : null}
        {step === 2 ? (
          <RewardDistributionStep form={form} onChange={handleFormChange} />
        ) : null}
        {step === 3 ? (
          <RewardCampaignScheduleStep form={form} onChange={handleFormChange} />
        ) : null}

        <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4">
          <div className="flex gap-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((step - 1) as WizardStep)}
                disabled={isPending}
              >
                上一步
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep((step + 1) as WizardStep)}
                disabled={isPending}
              >
                下一步
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              取消
            </Button>
            <Button type="button" onClick={handleSaveDraft} disabled={isPending}>
              儲存草稿
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handlePublish}
              disabled={isPending}
            >
              發布
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
