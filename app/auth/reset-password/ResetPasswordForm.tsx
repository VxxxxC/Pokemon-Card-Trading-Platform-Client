"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updatePasswordFromProfile } from "@/app/actions/auth";
import type { AuthFormErrors } from "@/lib/auth/validation";

function inputClass(hasError: boolean): string {
  return [
    "w-full h-11 px-4 rounded-lg pr-11",
    "bg-bg-elevated font-sans text-[14px] text-text-primary placeholder:text-text-disabled",
    "border outline-none transition-shadow",
    hasError
      ? "border-warning focus:ring-2 focus:ring-[rgba(239,68,68,0.30)]"
      : "border-[rgba(237,232,224,0.12)] focus:ring-2 focus:ring-[rgba(140,115,85,0.40)] focus:border-[rgba(212,165,116,0.40)]",
  ].join(" ");
}

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, formAction, isPending] = useActionState<
    AuthFormErrors | null,
    FormData
  >(updatePasswordFromProfile, null);

  const wasPending = useRef(false);
  const toggleShow = useCallback(() => setShowPassword((v) => !v), []);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      if (errors?.password) {
        toast.error(errors.password);
      } else if (errors?.currentPassword) {
        toast.error(errors.currentPassword);
      } else if (errors?.confirmPassword) {
        toast.error(errors.confirmPassword);
      } else if (errors?.form) {
        toast.error(errors.form);
      }
    }
    wasPending.current = isPending;
  }, [isPending, errors]);

  return (
    <form action={formAction} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="currentPassword"
          className="font-sans text-[13px] font-medium text-text-secondary block mb-1.5"
        >
          目前密碼
        </label>
        <div className="relative">
          <input
            id="currentPassword"
            name="currentPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputClass(!!errors?.currentPassword)}
          />
          <button
            type="button"
            onClick={toggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary text-[12px] font-mono"
            aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
          >
            {showPassword ? "隱藏" : "顯示"}
          </button>
        </div>
        {errors?.currentPassword && (
          <p className="mt-1 font-sans text-[12px] text-warning">
            {errors.currentPassword}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="password"
          className="font-sans text-[13px] font-medium text-text-secondary block mb-1.5"
        >
          新密碼
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputClass(!!errors?.password)}
          />
        </div>
        {errors?.password && (
          <p className="mt-1 font-sans text-[12px] text-warning">{errors.password}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="font-sans text-[13px] font-medium text-text-secondary block mb-1.5"
        >
          確認新密碼
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClass(!!errors?.confirmPassword)}
        />
        {errors?.confirmPassword && (
          <p className="mt-1 font-sans text-[12px] text-warning">
            {errors.confirmPassword}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-lg bg-brand font-sans text-[15px] font-semibold text-[#17130f] hover:bg-brand-hover active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "更新中…" : "更新密碼"}
      </button>
    </form>
  );
}
