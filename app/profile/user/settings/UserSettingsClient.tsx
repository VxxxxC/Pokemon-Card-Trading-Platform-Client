"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogoutModal } from "@/app/components/profile/LogoutModal";
import {
  updateUserProfile,
  type UserSettingsData,
} from "@/app/actions/profile";
import type { UserProfileFormErrors } from "@/lib/profile/validation";
import { cn } from "@/lib/utils";

type Props = {
  initialData: UserSettingsData;
};

const labelClass =
  "font-mono text-[10px] text-text-secondary block mb-1 leading-snug";

function fieldClass(hasError: boolean): string {
  return cn(
    "w-full h-10 px-3 bg-bg-page/50 border rounded-lg font-sans text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none transition-colors",
    hasError
      ? "border-warning focus:border-warning"
      : "border-[rgba(237,232,224,0.08)] focus:border-brand/30",
  );
}

function SettingsSection({
  id,
  title,
  children,
  variant = "default",
}: {
  id: string;
  title: string;
  children: ReactNode;
  variant?: "default" | "list";
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)]"
    >
      <div className="px-3 py-2.5 sm:px-4 border-b border-[rgba(237,232,224,0.06)]">
        <h2
          id={id}
          className="font-sans font-semibold text-[12px] text-text-primary"
        >
          {title}
        </h2>
      </div>
      <div
        className={cn(
          variant === "list"
            ? "divide-y divide-[rgba(237,232,224,0.06)]"
            : "p-3.5 sm:p-4",
        )}
      >
        {children}
      </div>
    </section>
  );
}

const settingsListRowClass =
  "flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4";

export function UserSettingsClient({ initialData }: Props) {
  const router = useRouter();
  const [errors, formAction, isPending] = useActionState<
    UserProfileFormErrors | null,
    FormData
  >(updateUserProfile, null);

  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      if (errors === null) {
        toast.success("個人資料及收款資料已更新");
        router.refresh();
      } else if (errors.username) {
        toast.error(errors.username);
      } else if (errors.displayName) {
        toast.error(errors.displayName);
      } else if (errors.bankAccount) {
        toast.error(errors.bankAccount);
      } else if (errors.fpsId) {
        toast.error(errors.fpsId);
      } else if (errors.fpsName) {
        toast.error(errors.fpsName);
      } else if (errors.form) {
        toast.error(errors.form);
      }
    }
    wasPending.current = isPending;
  }, [isPending, errors, router]);

  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="space-y-3">
        <form action={formAction} className="space-y-3">
          {errors?.form && (
            <p className="font-sans text-[12px] text-warning">{errors.form}</p>
          )}

          <SettingsSection id="personal-info-heading" title="個人資料">
            <div className="space-y-3">
              <div>
                <label htmlFor="display-name" className={labelClass}>
                  顯示名稱
                </label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  required
                  defaultValue={initialData.displayName}
                  key={`displayName-${initialData.displayName}`}
                  className={fieldClass(!!errors?.displayName)}
                />
                {errors?.displayName && (
                  <p className="mt-1 font-sans text-[11px] text-warning">
                    {errors.displayName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="handle" className={labelClass}>
                  用戶名
                </label>
                <div
                  className={cn(
                    "flex items-center h-10 bg-bg-page/50 border rounded-lg overflow-hidden transition-colors",
                    errors?.username
                      ? "border-warning"
                      : "border-[rgba(237,232,224,0.08)] focus-within:border-brand/30",
                  )}
                >
                  <span className="px-3 font-mono text-[12px] text-text-disabled border-r border-[rgba(237,232,224,0.08)] bg-bg-page/80 shrink-0">
                    @
                  </span>
                  <input
                    id="handle"
                    name="username"
                    type="text"
                    defaultValue={initialData.username}
                    key={`username-${initialData.username}`}
                    placeholder="選填"
                    className="flex-1 min-w-0 h-full bg-transparent pl-3 pr-3 font-mono text-[13px] text-text-primary focus:outline-none"
                  />
                </div>
                {errors?.username && (
                  <p className="mt-1 font-sans text-[11px] text-warning">
                    {errors.username}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="bio" className={labelClass}>
                  個人簡介
                </label>
                <textarea
                  id="bio"
                  name="shortDescription"
                  rows={2}
                  defaultValue={initialData.shortDescription}
                  key={`shortDescription-${initialData.shortDescription}`}
                  placeholder="介紹你的收藏方向或交易偏好（選填）"
                  className={cn(
                    fieldClass(!!errors?.shortDescription),
                    "h-auto min-h-[3.25rem] sm:min-h-[4.5rem] py-2.5 resize-none",
                  )}
                />
                {errors?.shortDescription && (
                  <p className="mt-1 font-sans text-[11px] text-warning">
                    {errors.shortDescription}
                  </p>
                )}
              </div>
            </div>
          </SettingsSection>

          <SettingsSection id="payment-heading" title="收款資料">
            <div className="space-y-3">
              <div>
                <label htmlFor="bank-account" className={labelClass}>
                  銀行名稱及帳號
                </label>
                <input
                  id="bank-account"
                  name="bankAccount"
                  type="text"
                  defaultValue={initialData.bankAccount ?? ""}
                  key={`bankAccount-${initialData.bankAccount ?? ""}`}
                  placeholder="例：滙豐銀行 123-456789-001"
                  className={fieldClass(!!errors?.bankAccount)}
                />
                {errors?.bankAccount && (
                  <p className="mt-1 font-sans text-[11px] text-warning">
                    {errors.bankAccount}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="fps-id" className={labelClass}>
                    轉數快 ID
                  </label>
                  <input
                    id="fps-id"
                    name="fpsId"
                    type="text"
                    defaultValue={initialData.fpsId ?? ""}
                    key={`fpsId-${initialData.fpsId ?? ""}`}
                    placeholder="電話、電郵或 FPS ID"
                    className={fieldClass(!!errors?.fpsId)}
                  />
                  {errors?.fpsId && (
                    <p className="mt-1 font-sans text-[11px] text-warning">
                      {errors.fpsId}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="fps-name" className={labelClass}>
                    轉數快收款人姓名
                  </label>
                  <input
                    id="fps-name"
                    name="fpsName"
                    type="text"
                    defaultValue={initialData.fpsName ?? ""}
                    key={`fpsName-${initialData.fpsName ?? ""}`}
                    placeholder="須與銀行登記一致"
                    className={fieldClass(!!errors?.fpsName)}
                  />
                  {errors?.fpsName && (
                    <p className="mt-1 font-sans text-[11px] text-warning">
                      {errors.fpsName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </SettingsSection>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-lg hover:bg-brand-hover active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "儲存中…" : "儲存更改"}
          </button>
        </form>

        <SettingsSection id="security-heading" title="安全設定" variant="list">
          <div className={settingsListRowClass}>
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-text-secondary">
                電郵地址
              </p>
              <p className="font-sans text-[13px] text-text-primary font-medium break-all mt-0.5">
                {initialData.email || "—"}
              </p>
            </div>
          </div>
          <div className={settingsListRowClass}>
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-text-secondary">
                登入密碼
              </p>
              <p className="font-sans text-[13px] text-text-primary font-medium mt-0.5">
                ••••••••••••
              </p>
            </div>
            <Link
              href="/auth/reset-password"
              className="shrink-0 font-mono text-[10px] text-brand hover:text-brand-hover transition-colors"
            >
              更改
            </Link>
          </div>
        </SettingsSection>

        <SettingsSection id="notif-heading" title="通知設定" variant="list">
          {[
            {
              label: "訂單狀態更新",
              desc: "Escrow 進度變更即時推送",
              on: true,
            },
            { label: "每日簽到提醒", desc: "連續簽到里程碑提醒", on: true },
            {
              label: "市場價格波動",
              desc: "持有卡牌超出 ±10% 提醒",
              on: false,
            },
            {
              label: "新卡上架提醒",
              desc: "追蹤系列有新商品時通知",
              on: false,
            },
          ].map(({ label, desc, on }) => (
            <div key={label} className={settingsListRowClass}>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[13px] font-semibold text-text-primary">
                  {label}
                </p>
                <p className="font-mono text-[10px] text-text-secondary truncate mt-0.5">
                  {desc}
                </p>
              </div>
              <button
                type="button"
                aria-label={`切換 ${label} 通知狀態`}
                className={cn(
                  "w-9 h-5 rounded-full flex items-center transition-colors shrink-0 cursor-pointer",
                  on
                    ? "bg-brand justify-end pr-0.5"
                    : "bg-bg-elevated justify-start pl-0.5",
                )}
              >
                <div className="w-4 h-4 rounded-full bg-[#17130f] shadow-sm" />
              </button>
            </div>
          ))}
        </SettingsSection>

        <SettingsSection id="session-ctrl" title="登出帳戶" variant="list">
          <LogoutModal variant="list" />
        </SettingsSection>
      </div>
    </div>
  );
}
