"use client";

import { useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "login" | "register";

interface LoginFields {
  email: string;
  password: string;
  remember: boolean;
}

interface RegisterFields {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  isMerchant: boolean; // 🟢 Merchant segregation flag
}

type FormErrors = Record<string, string>;

// ─── STAGE 2: Regex validation constants ──────────────────────────────────────
// Username: 3-24 chars, English letters / numbers / underscore / dash only
const usernameRegex = /^[A-Za-z0-9_-]{3,24}$/;

// Password: 8-32 chars, must contain at least one of each:
// lowercase, uppercase, digit, and special character
const passwordComplexityRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+=[\]\\/-])[A-Za-z\d!@#$%^&*(),.?":{}|<>_+=[\]\\/-]{8,32}$/;

// ─── Shared input class ────────────────────────────────────────────────────────
function inputClass(hasError: boolean): string {
  return [
    "w-full h-11 px-4 rounded-lg",
    "bg-bg-card font-sans text-[14px] text-text-primary placeholder:text-text-disabled",
    "border outline-none transition-shadow",
    hasError
      ? "border-warning focus:ring-2 focus:ring-[rgba(239,68,68,0.30)]"
      : "border-[rgba(237,232,224,0.12)] focus:ring-2 focus:ring-[rgba(140,115,85,0.40)] focus:border-[rgba(212,165,116,0.40)]",
  ].join(" ");
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({
  checked,
  hasError,
  onChange,
}: {
  checked: boolean;
  hasError?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={[
        "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
        checked
          ? "bg-brand border-brand"
          : hasError
            ? "bg-transparent border-warning"
            : "bg-transparent border-[rgba(237,232,224,0.25)] hover:border-brand",
      ].join(" ")}
    >
      {checked && (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#17130f"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

// ─── Switch (luxury dark-golden toggle) ───────────────────────────────────────
function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={[
        "relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200",
        checked
          ? "bg-brand shadow-[0_0_14px_rgba(212,165,116,0.40)]"
          : "bg-[rgba(237,232,224,0.10)] border border-[rgba(237,232,224,0.14)]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          checked
            ? "translate-x-5 bg-[#17130f]"
            : "translate-x-0 bg-[rgba(237,232,224,0.45)]",
        ].join(" ")}
      />
    </button>
  );
}

// ─── Eye icons ─────────────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
  labelRight,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  labelRight?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-sans text-[13px] font-medium text-text-secondary">
          {label}
        </label>
        {labelRight}
      </div>
      {children}
      {error && (
        <p className="mt-1 font-sans text-[12px] text-warning">{error}</p>
      )}
    </div>
  );
}

// ─── Password input ────────────────────────────────────────────────────────────
function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  hasError,
  showPassword,
  onToggleShow,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete: string;
  hasError: boolean;
  showPassword: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder ?? "••••••••"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(hasError) + " pr-11"}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-disabled hover:text-text-secondary transition-colors"
        aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

// ─── STAGE 1: Merchant approval confirmation panel ────────────────────────────
function MerchantConfirmationPanel({
  onBackToLogin,
}: {
  onBackToLogin: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-2 animate-in fade-in duration-500">
      {/* Institutional seal */}
      <div className="w-16 h-16 rounded-2xl bg-[rgba(212,165,116,0.10)] border border-[rgba(212,165,116,0.26)] flex items-center justify-center mb-6 shadow-[0_0_36px_rgba(212,165,116,0.10)]">
        <span className="text-3xl" aria-hidden="true">
          🏛️
        </span>
      </div>

      {/* Title */}
      <h2 className="font-sans text-[19px] font-bold text-text-primary leading-tight mb-3">
        商戶帳號註冊申請已成功提交
      </h2>

      {/* Golden divider */}
      <div className="w-10 h-px bg-[rgba(212,165,116,0.45)] mb-4" />

      {/* Body copy — paragraph 1 */}
      <p className="font-sans text-[13px] text-text-secondary leading-relaxed max-w-xs mb-3">
        平台管理員已收到您的認證商戶入駐申請。由於涉及大盤交易流通安全，管理員將於{" "}
        <span className="text-brand font-medium">24 小時</span> 內完成初審。
      </p>

      {/* Body copy — paragraph 2 */}
      <p className="font-sans text-[13px] text-text-secondary leading-relaxed max-w-xs mb-6">
        審批通過後，系統將自動向您發送{" "}
        <span className="text-brand font-medium">
          Merchant Account Approved
        </span>{" "}
        認證電郵，並附加一串{" "}
        <span className="text-text-primary font-medium">
          一次性安全憑證 URL (One-Time Token Link)
        </span>{" "}
        供您直接進行首次滿血登入登載。請耐心等待審查。
      </p>

      {/* Status info pill */}
      <div className="w-full p-3.5 bg-[#17130f] rounded-xl border border-[rgba(212,165,116,0.14)] mb-6">
        <div className="flex items-center gap-2.5 text-left">
          <span className="text-brand text-base shrink-0" aria-hidden="true">
            ⏳
          </span>
          <p className="font-sans text-[12px] text-text-secondary">
            預計審查時效：
            <span className="text-brand font-semibold">24 小時內</span> ·
            請留意認證電郵收件匣及垃圾郵件資料夾
          </p>
        </div>
      </div>

      {/* CTA — returns to login tab */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full h-11 rounded-lg bg-brand font-sans text-[15px] font-semibold text-[#17130f] hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform"
      >
        返回登入
      </button>
    </div>
  );
}

// ─── AuthForm ──────────────────────────────────────────────────────────────────
export function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  // Merchant approval intercept gate
  const [merchantSubmitted, setMerchantSubmitted] = useState(false);

  const [loginFields, setLoginFields] = useState<LoginFields>({
    email: "",
    password: "",
    remember: false,
  });

  const [registerFields, setRegisterFields] = useState<RegisterFields>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    isMerchant: false,
  });

  // ── validation ──────────────────────────────────────────────────────────────
  const validateLogin = useCallback((): FormErrors => {
    const e: FormErrors = {};
    if (!loginFields.email) e.email = "請輸入電子郵件";
    else if (!/\S+@\S+\.\S+/.test(loginFields.email))
      e.email = "電子郵件格式不正確";
    if (!loginFields.password) e.password = "請輸入密碼";
    else if (loginFields.password.length < 8) e.password = "密碼至少 8 個字元";
    return e;
  }, [loginFields]);

  const validateRegister = useCallback((): FormErrors => {
    const e: FormErrors = {};
    // STAGE 2 — Username regex gate
    if (!registerFields.username) e.username = "請輸入用戶名稱";
    else if (!usernameRegex.test(registerFields.username)) {
      e.username =
        "用戶名稱限 3-24 字元，且只可包含英文、數字、底線(_)或連字號(-)";
    }
    if (!registerFields.email) e.email = "請輸入電子郵件";
    else if (!/\S+@\S+\.\S+/.test(registerFields.email))
      e.email = "電子郵件格式不正確";
    // STAGE 2 — Password complexity regex gate
    if (!registerFields.password) e.password = "請輸入密碼";
    else if (!passwordComplexityRegex.test(registerFields.password)) {
      e.password =
        "密碼限 8-32 字元，且必須同時包含大、小寫英文、數字及特殊符號";
    }
    if (registerFields.password !== registerFields.confirmPassword)
      e.confirmPassword = "兩次輸入的密碼不一致";
    if (!registerFields.agreeTerms) e.agreeTerms = "請同意服務條款及私隱政策";
    return e;
  }, [registerFields]);

  // ── submit handlers ─────────────────────────────────────────────────────────
  const handleLoginSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const errs = validateLogin();
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setLoading(true);
      // TODO: [server] replace with Supabase auth.signInWithPassword()
      await new Promise<void>((r) => setTimeout(r, 1000));
      setLoading(false);
    },
    [validateLogin],
  );

  const handleRegisterSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const errs = validateRegister();
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setLoading(true);
      // TODO: [server] replace with Supabase auth.signUp()
      // Pass isMerchant flag so the backend can apply the MERCHANT role and hold approval flow
      await new Promise<void>((r) => setTimeout(r, 1000));
      setLoading(false);

      if (registerFields.isMerchant) {
        // STAGE 1 — Merchant path: intercept standard dashboard redirect.
        // Display admin-approval confirmation panel instead.
        setMerchantSubmitted(true);
        return;
      }
      // TODO: [server] Standard buyer path: router.push("/profile/user") after Supabase signUp
    },
    [validateRegister, registerFields.isMerchant],
  );

  // ── tab switch — guaranteed clean slate, no state leaks ────────────────────
  const handleTabChange = useCallback((next: Tab) => {
    setTab(next);
    setErrors({});
    setShowPassword(false);
    // STAGE 1 mandate: isMerchant must reset to false on every tab switch
    setRegisterFields((f) => ({ ...f, isMerchant: false }));
    setMerchantSubmitted(false);
  }, []);

  const toggleShow = useCallback(() => setShowPassword((v) => !v), []);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      {/* ── Header: Heading + Tab bar — stable, not shifted by form content ── */}
      <div className="shrink-0">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 -ml-1 w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:scale-95 transition-all"
          aria-label="返回上一頁"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Heading — adapts when merchant confirmation is active */}
        <div className="mb-8">
          <h1 className="font-sans text-[26px] font-bold text-text-primary leading-tight">
            {tab === "login"
              ? "歡迎回來"
              : merchantSubmitted
                ? "申請已提交"
                : "建立帳戶"}
          </h1>
          <p className="mt-1.5 font-sans text-[14px] text-text-secondary leading-relaxed">
            {tab === "login"
              ? "登入以查看您的卡牌收藏與交易記錄"
              : merchantSubmitted
                ? "您的認證商戶申請正在人工審核中"
                : "加入 PokéTrade JP，開始交易日版精選卡牌"}
          </p>
        </div>

        {/* Tab bar */}
        <div className="relative flex bg-bg-card rounded-lg p-1 mb-8 border border-[rgba(237,232,224,0.08)]">
          {/* Sliding active pill */}
          <div
            className="absolute top-1 bottom-1 rounded-md bg-[rgba(212,165,116,0.14)] border border-[rgba(212,165,116,0.22)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
            style={{
              width: "calc(50% - 4px)",
              transform:
                tab === "login"
                  ? "translateX(0)"
                  : "translateX(calc(100% + 4px))",
            }}
          />
          <button
            type="button"
            onClick={() => handleTabChange("login")}
            className={`relative flex-1 h-9 font-sans text-[14px] font-medium rounded-md transition-colors z-10 ${
              tab === "login"
                ? "text-brand"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            登入
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("register")}
            className={`relative flex-1 h-9 font-sans text-[14px] font-medium rounded-md transition-colors z-10 ${
              tab === "register"
                ? "text-brand"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            免費註冊
          </button>
        </div>
      </div>
      {/* ── /Header ── */}

      {/* ── Login form ─────────────────────────────────────────────────────── */}
      {tab === "login" && (
        <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
          <Field label="電子郵件" error={errors.email}>
            <input
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={loginFields.email}
              onChange={(e) =>
                setLoginFields((f) => ({ ...f, email: e.target.value }))
              }
              className={inputClass(!!errors.email)}
            />
          </Field>

          <Field
            label="密碼"
            error={errors.password}
            labelRight={
              <Link
                href="/auth/reset-password"
                className="font-sans text-[12px] text-brand hover:text-brand-hover transition-colors"
              >
                忘記密碼？
              </Link>
            }
          >
            <PasswordInput
              value={loginFields.password}
              onChange={(v) => setLoginFields((f) => ({ ...f, password: v }))}
              autoComplete="current-password"
              hasError={!!errors.password}
              showPassword={showPassword}
              onToggleShow={toggleShow}
            />
          </Field>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={loginFields.remember}
              onChange={() =>
                setLoginFields((f) => ({ ...f, remember: !f.remember }))
              }
            />
            <span className="font-sans text-[13px] text-text-secondary select-none">
              記住我
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-lg bg-brand font-sans text-[15px] font-semibold text-[#17130f] hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "登入中…" : "登入"}
          </button>
        </form>
      )}

      {/* ── Register form ──────────────────────────────────────────────────── */}
      {tab === "register" && !merchantSubmitted && (
        <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
          {/* STAGE 1 — Merchant toggle row, injected above 用戶名稱 */}
          <div className="flex items-center justify-between p-3.5 bg-[#17130f] rounded-xl border border-white/5">
            <div className="min-w-0 pr-4">
              <p className="font-sans text-[13px] font-medium text-text-primary leading-snug">
                🏪 申請註冊成為認證商戶
              </p>
            </div>
            <Switch
              checked={registerFields.isMerchant}
              onChange={() =>
                setRegisterFields((f) => ({ ...f, isMerchant: !f.isMerchant }))
              }
            />
          </div>

          <Field label="用戶名稱" error={errors.username}>
            <input
              type="text"
              autoComplete="username"
              placeholder="poketrader_jp"
              value={registerFields.username}
              onChange={(e) =>
                setRegisterFields((f) => ({ ...f, username: e.target.value }))
              }
              className={inputClass(!!errors.username)}
            />
          </Field>

          <Field label="電子郵件" error={errors.email}>
            <input
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={registerFields.email}
              onChange={(e) =>
                setRegisterFields((f) => ({ ...f, email: e.target.value }))
              }
              className={inputClass(!!errors.email)}
            />
          </Field>

          <Field label="密碼" error={errors.password}>
            <PasswordInput
              value={registerFields.password}
              onChange={(v) =>
                setRegisterFields((f) => ({ ...f, password: v }))
              }
              autoComplete="new-password"
              placeholder="••••••••（含大小寫、數字及特殊符號）"
              hasError={!!errors.password}
              showPassword={showPassword}
              onToggleShow={toggleShow}
            />
          </Field>

          <Field label="確認密碼" error={errors.confirmPassword}>
            <PasswordInput
              value={registerFields.confirmPassword}
              onChange={(v) =>
                setRegisterFields((f) => ({ ...f, confirmPassword: v }))
              }
              autoComplete="new-password"
              hasError={!!errors.confirmPassword}
              showPassword={showPassword}
              onToggleShow={toggleShow}
            />
          </Field>

          {/* Terms */}
          <div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Checkbox
                  checked={registerFields.agreeTerms}
                  hasError={!!errors.agreeTerms}
                  onChange={() =>
                    setRegisterFields((f) => ({
                      ...f,
                      agreeTerms: !f.agreeTerms,
                    }))
                  }
                />
              </div>
              <span className="font-sans text-[13px] text-text-secondary leading-relaxed">
                我已閱讀並同意{" "}
                <Link
                  href="/terms"
                  className="text-brand hover:text-brand-hover underline-offset-2 hover:underline transition-colors"
                >
                  服務條款
                </Link>{" "}
                及{" "}
                <Link
                  href="/privacy"
                  className="text-brand hover:text-brand-hover underline-offset-2 hover:underline transition-colors"
                >
                  私隱政策
                </Link>
              </span>
            </div>
            {errors.agreeTerms && (
              <p className="mt-1 pl-6 font-sans text-[12px] text-warning">
                {errors.agreeTerms}
              </p>
            )}
          </div>

          {/* Submit CTA — copy adapts to isMerchant state */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-lg bg-brand font-sans text-[15px] font-semibold text-[#17130f] hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "建立中…"
              : registerFields.isMerchant
                ? "提交商戶入駐申請"
                : "免費建立帳戶"}
          </button>
        </form>
      )}

      {/* ── STAGE 1: Merchant approval confirmation panel ──────────────────── */}
      {tab === "register" && merchantSubmitted && (
        <MerchantConfirmationPanel
          onBackToLogin={() => handleTabChange("login")}
        />
      )}

      {/* Footer */}
      <p className="mt-8 text-center font-sans text-[12px] text-text-disabled">
        © 2026 PokéTrade JP · 所有交易受平台監管保障
      </p>
    </div>
  );
}
