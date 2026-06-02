"use client";

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type OrderFlowType =
  | "meetup"
  | "delivery"
  | "escrow_auth"
  | "escrow_no_auth";

export type OrderStep = {
  id: string;
  label: string;
};

interface OrderLifecycleStepperProps {
  steps: OrderStep[];
  status: string;
  isFinished: boolean;
  title?: string;
  eyebrow?: string;
  statusLabel?: string;
  variant?: "compact" | "grand";
  className?: string;
}

function getActiveStep(
  steps: OrderStep[],
  status: string,
  isFinished: boolean,
) {
  if (steps.length === 0) return 1;
  if (isFinished) return steps.length;

  const index = steps.findIndex((step) => step.id === status);
  return index >= 0 ? index + 1 : 1;
}

export function OrderLifecycleStepper({
  steps,
  status,
  isFinished,
  title,
  eyebrow,
  statusLabel,
  variant = "compact",
  className,
}: OrderLifecycleStepperProps) {
  const activeStep = getActiveStep(steps, status, isFinished);
  const isGrand = variant === "grand";
  const currentStep = steps[activeStep - 1] ?? steps[0];
  const nextStep = steps[activeStep];
  const progressValue =
    steps.length > 0 ? (activeStep / steps.length) * 100 : 0;

  return (
    <div
      className={cn(
        isGrand &&
          "rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-6 shadow-lg md:p-8",
        className,
      )}
    >
      {isGrand && (title || eyebrow || statusLabel) && (
        <div className="mb-6 flex flex-col gap-3 border-b border-[rgba(237,232,224,0.06)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h3 className="font-sans text-[15px] font-black tracking-tight text-text-primary md:text-[17px]">
                {title}
              </h3>
            )}
            {eyebrow && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-brand">
                {eyebrow}
              </p>
            )}
          </div>
          {statusLabel && (
            <span className="self-start rounded-xl border border-brand/20 bg-brand/5 px-3 py-1 font-mono text-[12px] text-brand sm:self-center">
              {statusLabel}
            </span>
          )}
        </div>
      )}

      {/* Mobile UX: no long horizontal scroll; show concise lifecycle summary. */}
      <div
        className={cn(
          "sm:hidden",
          isGrand
            ? "rounded-xl border border-[rgba(237,232,224,0.08)] bg-[#17130f] p-4"
            : "rounded-lg border border-[rgba(237,232,224,0.06)] bg-[#17130f]/70 p-3",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#50453b]">
              Step {activeStep}/{Math.max(steps.length, 1)}
            </p>
            <p
              className={cn(
                "mt-1 truncate font-sans font-bold text-brand",
                isGrand ? "text-[15px]" : "text-[12px]",
              )}
            >
              {currentStep?.label ?? "交易狀態同步中"}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border font-mono font-black",
              isFinished
                ? "border-success/25 bg-success/10 text-success"
                : "border-brand/25 bg-brand/10 text-brand",
              isGrand ? "px-3 py-1 text-[12px]" : "px-2 py-0.5 text-[10px]",
            )}
          >
            {isFinished ? "DONE" : "LIVE"}
          </span>
        </div>

        <Progress
          value={progressValue}
          className={cn(
            "mt-3 gap-0 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-[#2e2925]",
            isFinished
              ? "[&_[data-slot=progress-indicator]]:bg-success"
              : "[&_[data-slot=progress-indicator]]:bg-brand",
          )}
        />

        <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[10px]">
          <span className="truncate text-text-disabled">
            {isFinished
              ? "平台存證已完成"
              : nextStep
                ? `下一步：${nextStep.label}`
                : "等待最後確認"}
          </span>
          <span className="shrink-0 text-[#50453b]">{steps.length} STAGES</span>
        </div>
      </div>

      <div className="hidden overflow-x-auto py-1 scrollbar-none sm:block">
        <Stepper
          value={activeStep}
          orientation="horizontal"
          indicators={{ completed: "✓" }}
          className={cn(isGrand ? "min-w-[680px]" : "min-w-max")}
        >
          <StepperNav className="w-full">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = isFinished
                ? stepNumber <= activeStep
                : stepNumber < activeStep;

              return (
                <StepperItem
                  key={step.id}
                  step={stepNumber}
                  completed={isCompleted}
                  className={cn(isGrand ? "min-w-[112px]" : "min-w-[82px]")}
                >
                  <StepperTrigger
                    disabled
                    className={cn(
                      "cursor-default flex-col gap-1.5 rounded-xl p-0 disabled:opacity-100",
                      isGrand && "gap-2",
                    )}
                  >
                    <StepperIndicator
                      className={cn(
                        "border-2 bg-[#2e2925] font-mono font-bold text-[#50453b] data-[state=active]:border-brand data-[state=active]:bg-brand/15 data-[state=active]:text-brand data-[state=completed]:border-success data-[state=completed]:bg-success data-[state=completed]:text-white",
                        isGrand ? "size-9 text-[13px]" : "size-6 text-[10px]",
                      )}
                    >
                      {stepNumber}
                    </StepperIndicator>
                    <StepperTitle
                      className={cn(
                        "max-w-[76px] text-center font-mono leading-tight text-[#50453b] data-[state=active]:font-bold data-[state=active]:text-brand data-[state=completed]:text-success",
                        isGrand
                          ? "max-w-[106px] text-[11px] md:text-[12px]"
                          : "text-[9px]",
                      )}
                    >
                      {step.label}
                    </StepperTitle>
                  </StepperTrigger>
                  {index < steps.length - 1 && (
                    <StepperSeparator
                      className={cn(
                        "mx-1 bg-[#2e2925] transition-colors data-[state=completed]:bg-success",
                        isGrand ? "mt-[18px]" : "mt-[12px]",
                      )}
                    />
                  )}
                </StepperItem>
              );
            })}
          </StepperNav>
        </Stepper>
      </div>
    </div>
  );
}
