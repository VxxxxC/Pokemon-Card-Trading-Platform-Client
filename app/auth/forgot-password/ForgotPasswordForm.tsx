"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestForgotPassword,
  type ForgotPasswordRequestResult,
} from "@/app/actions/auth";

function inputClass(hasError: boolean): string {
  return [
    "w-full h-11 px-4 rounded-lg",
    "bg-bg-elevated font-sans text-[14px] text-text-primary placeholder:text-text-disabled",
    "border outline-none transition-shadow",
    hasError
      ? "border-warning focus:ring-2 focus:ring-[rgba(239,68,68,0.30)]"
      : "border-[rgba(237,232,224,0.12)] focus:ring-2 focus:ring-[rgba(140,115,85,0.40)] focus:border-[rgba(212,165,116,0.40)]",
  ].join(" ");
}

type Props = {
  expiredMessage?: boolean;
};

export function ForgotPasswordForm({ expiredMessage }: Props) {
  const [state, formAction, isPending] = useActionState<
    ForgotPasswordRequestResult | null,
    FormData
  >(requestForgotPassword, null);

  const errors = state?.status === "error" ? state.errors : null;
  const sent = state?.status === "sent";

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-success/25 bg-[rgba(16,185,129,0.08)] px-4 py-3">
          <p className="font-sans text-[14px] text-success font-medium">
            重設郵件已送出
          </p>
          <p className="mt-1 font-sans text-[13px] text-text-secondary leading-relaxed">
            若該電郵已註冊，您將收到密碼重設連結。請檢查收件匣及垃圾郵件資料夾。
          </p>
        </div>
        <Link
          href="/auth"
          className="block w-full h-11 rounded-lg bg-brand font-sans text-[15px] font-semibold text-[#17130f] hover:bg-brand-hover text-center leading-[44px] transition-colors"
        >
          返回登入
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      {expiredMessage && (
        <p className="font-sans text-[13px] text-warning leading-relaxed">
          重設連結已失效或已過期，請重新申請。
        </p>
      )}
      <div>
        <label
          htmlFor="forgot-email"
          className="font-sans text-[13px] font-medium text-text-secondary block mb-1.5"
        >
          電子郵件
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          className={inputClass(!!errors?.email)}
        />
        {errors?.email && (
          <p className="mt-1 font-sans text-[12px] text-warning">{errors.email}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-lg bg-brand font-sans text-[15px] font-semibold text-[#17130f] hover:bg-brand-hover active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "發送中…" : "發送重設連結"}
      </button>
      <p className="font-sans text-[12px] text-text-disabled leading-relaxed">
        僅供未登入用戶使用。已登入請至帳戶設定更改密碼。
      </p>
    </form>
  );
}
