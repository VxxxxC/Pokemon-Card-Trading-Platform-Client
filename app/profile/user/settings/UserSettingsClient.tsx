"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { LogoutModal } from "@/app/components/profile/LogoutModal";
import {
  updateUserProfile,
  type UserSettingsData,
} from "@/app/actions/profile";
import type { UserProfileFormErrors } from "@/lib/profile/validation";

type Props = {
  initialData: UserSettingsData;
};

function fieldClass(hasError: boolean): string {
  return [
    "w-full bg-bg-elevated border rounded-xl font-sans text-[13.5px] text-text-primary placeholder-text-disabled focus:outline-none transition-colors",
    hasError
      ? "border-warning focus:border-warning"
      : "border-[rgba(237,232,224,0.12)] focus:border-brand/50",
  ].join(" ");
}

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
    <div className="min-h-screen bg-bg-page flex flex-col text-[#eae1da]">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pt-4 pb-28 lg:pb-12 space-y-6 animate-fadeIn">
        <div className="font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5 select-none">
          <Link
            href="/profile/user"
            className="hover:text-brand transition-colors"
          >
            👤 我的帳號總覽
          </Link>
          <span className="text-text-disabled">/</span>
          <span className="text-text-disabled uppercase">
            Settings 帳戶設定
          </span>
        </div>

        <div>
          <h2 className="font-sans font-black text-[22px] lg:text-[26px] text-[#eae1da] tracking-tight">
            帳戶安全與設定中心
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            PROFILE CONFIGURATION & SECURITY GATEWAY
          </p>
        </div>

        <div className="max-w-[640px] w-full space-y-6">
          <section
            aria-labelledby="personal-info-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-xs"
          >
            <h2
              id="personal-info-heading"
              className="font-sans font-bold text-[15px] text-text-primary mb-4"
            >
              個人資料
            </h2>
            <form action={formAction} className="space-y-4">
              {errors?.form && (
                <p className="font-sans text-[12px] text-warning">{errors.form}</p>
              )}
              <div>
                <label
                  htmlFor="display-name"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  顯示名稱
                </label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  required
                  defaultValue={initialData.displayName}
                  key={`displayName-${initialData.displayName}`}
                  className={`${fieldClass(!!errors?.displayName)} h-11 px-4`}
                />
                {errors?.displayName && (
                  <p className="mt-1 font-sans text-[12px] text-warning">
                    {errors.displayName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="handle"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  用戶名 (Handle)
                </label>
                <div
                  className={`flex items-center h-11 bg-bg-elevated border rounded-xl overflow-hidden transition-colors ${errors?.username ? "border-warning" : "border-[rgba(237,232,224,0.12)] focus-within:border-brand/50"}`}
                >
                  <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-[rgba(237,232,224,0.08)] bg-[#17130f]/30">
                    @
                  </span>
                  <input
                    id="handle"
                    name="username"
                    type="text"
                    defaultValue={initialData.username}
                    key={`username-${initialData.username}`}
                    placeholder="選填"
                    className="flex-1 h-full bg-transparent px-3 font-mono text-[13.5px] text-text-primary focus:outline-none"
                  />
                </div>
                {errors?.username && (
                  <p className="mt-1 font-sans text-[12px] text-warning">
                    {errors.username}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="bio"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  個人簡介
                </label>
                <textarea
                  id="bio"
                  name="shortDescription"
                  rows={3}
                  defaultValue={initialData.shortDescription}
                  key={`shortDescription-${initialData.shortDescription}`}
                  placeholder="介紹你的收藏方向或交易偏好（選填）"
                  className={`${fieldClass(!!errors?.shortDescription)} px-4 py-3 resize-none`}
                />
                {errors?.shortDescription && (
                  <p className="mt-1 font-sans text-[12px] text-warning">
                    {errors.shortDescription}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[rgba(237,232,224,0.08)] space-y-4">
                <div>
                  <label
                    htmlFor="bank-account"
                    className="font-mono text-[12px] text-text-secondary block mb-1.5"
                  >
                    銀行名稱及帳號 (Bank Name & Account Number)
                  </label>
                  <input
                    id="bank-account"
                    name="bankAccount"
                    type="text"
                    defaultValue={initialData.bankAccount ?? ""}
                    key={`bankAccount-${initialData.bankAccount ?? ""}`}
                    placeholder="例：滙豐銀行 123-456789-001"
                    className={`${fieldClass(!!errors?.bankAccount)} h-11 px-4`}
                  />
                  {errors?.bankAccount && (
                    <p className="mt-1 font-sans text-[12px] text-warning">
                      {errors.bankAccount}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="fps-id"
                    className="font-mono text-[12px] text-text-secondary block mb-1.5"
                  >
                    轉數快 (FPS ID / Phone / Email)
                  </label>
                  <input
                    id="fps-id"
                    name="fpsId"
                    type="text"
                    defaultValue={initialData.fpsId ?? ""}
                    key={`fpsId-${initialData.fpsId ?? ""}`}
                    placeholder="例：16888888 或 91234567 或 user@example.com"
                    className={`${fieldClass(!!errors?.fpsId)} h-11 px-4`}
                  />
                  {errors?.fpsId && (
                    <p className="mt-1 font-sans text-[12px] text-warning">
                      {errors.fpsId}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="fps-name"
                    className="font-mono text-[12px] text-text-secondary block mb-1.5"
                  >
                    轉數快收款人姓名
                  </label>
                  <input
                    id="fps-name"
                    name="fpsName"
                    type="text"
                    defaultValue={initialData.fpsName ?? ""}
                    key={`fpsName-${initialData.fpsName ?? ""}`}
                    placeholder="例：陳大文（須與銀行登記一致）"
                    className={`${fieldClass(!!errors?.fpsName)} h-11 px-4`}
                  />
                  {errors?.fpsName && (
                    <p className="mt-1 font-sans text-[12px] text-warning">
                      {errors.fpsName}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="h-11 px-6 bg-brand text-[#17130f] font-sans font-bold text-[13.5px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "儲存中…" : "儲存更改"}
              </button>
            </form>
          </section>

          <section
            aria-labelledby="security-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-xs"
          >
            <h2
              id="security-heading"
              className="font-sans font-bold text-[15px] text-text-primary mb-4"
            >
              安全設定
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)]">
                <div>
                  <p className="font-mono text-[11px] text-text-secondary mb-0.5">
                    電郵地址
                  </p>
                  <p className="font-sans text-[13px] text-text-primary font-medium break-all">
                    {initialData.email || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)]">
                <div>
                  <p className="font-mono text-[11px] text-text-secondary mb-0.5">
                    登入密碼
                  </p>
                  <p className="font-sans text-[13px] text-text-primary font-medium">
                    ••••••••••••
                  </p>
                </div>
                <Link
                  href="/auth/reset-password"
                  className="font-mono text-[11px] text-brand hover:text-brand-hover border border-brand/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                  更改
                </Link>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="notif-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-xs"
          >
            <h2
              id="notif-heading"
              className="font-sans font-bold text-[15px] text-text-primary mb-4"
            >
              通知設定
            </h2>
            <div className="space-y-3">
              {/* TODO: [database] Notification preferences (`on: true/false`) are hardcoded — replace with user's actual preferences from `notification_settings` table in Supabase */}
              {/* TODO: [server] Toggle buttons have no onClick handlers — must call server action to UPDATE `notification_settings` for current user */}
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
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)] hover:border-[rgba(237,232,224,0.15)] transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-sans text-[13px] font-bold text-text-primary">
                      {label}
                    </p>
                    <p className="font-mono text-[11px] text-text-secondary truncate">
                      {desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`切換 ${label} 通知狀態`}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors shrink-0 cursor-pointer ${on ? "bg-brand justify-end pr-0.5" : "bg-bg-hover justify-start pl-0.5"}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-[#17130f] shadow" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="session-ctrl"
            className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 shadow-sm"
          >
            <h2
              id="session-ctrl"
              className="font-mono text-[10.5px] font-bold text-text-disabled uppercase tracking-wider mb-3"
            >
              Session Control
            </h2>
            <LogoutModal />
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
