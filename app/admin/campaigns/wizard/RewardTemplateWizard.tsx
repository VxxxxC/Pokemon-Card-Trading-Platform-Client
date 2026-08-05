"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  setAdminRewardTemplateStatus,
  upsertAdminRewardTemplate,
} from "@/app/actions/admin-rewards";
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
    setForm(row ? rowToForm(row) : buildDefaultForm());
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      resetForOpen(initialRow);
    }
    onOpenChange(next);
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
          <RewardTemplateDefinitionStep form={form} onChange={setForm} />
        ) : null}
        {step === 2 ? (
          <RewardDistributionStep form={form} onChange={setForm} />
        ) : null}
        {step === 3 ? <RewardCampaignScheduleStep /> : null}

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
