"use client";

import {
  useState,
  useEffect,
  useCallback,
  startTransition,
  useActionState,
} from "react";
import Link from "next/link";
// 🟢 核心引入：加裝 useSearchParams 捕捉大盤外部跳轉載荷
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Tab = "login" | "register";

type FormErrors = Record<string, string>;

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

function PasswordInput({
  name,
  placeholder,
  autoComplete,
  hasError,
  showPassword,
  onToggleShow,
}: {
  name: string;
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
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder ?? "••••••••"}
        className={inputClass(hasError) + " pr-11"}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-disabled hover:text-text-secondary transition-colors focus:outline-none"
        aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

export function AuthForm() {
  const router = useRouter();
  // 🟢 接入 Next.js 16 搜尋參數解碼器
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);

  // ── 🟢 React 19 原生表單動作架構：本地僅保留純 UI 互動旗標，文字載荷全數交由原生 FormData 託管 ──
  const [remember, setRemember] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);

  // ── 🟢 核心狀態加裝：商戶審批成功攔截看板 ──
  const [isMerchantSubmitted, setIsMerchantSubmitted] = useState(false);

  // ── 🟢 終極破局：網址參數雷達自動追蹤與切換 ──
  useEffect(() => {
    if (!searchParams) return;
    const role = searchParams.get("role");

    // 如果帶有商戶標記，直接阻斷 Login 預設，滑動切換去 Register 並自動剔選 Toggle
    if (role === "merchant") {
      startTransition(() => {
        setTab("register");
        setIsMerchant(true);
      });
    }
  }, [searchParams]);

  // ── 🟢 React 19 useActionState：登入提交管線（原生 FormData 讀取，零受控狀態微突變）──
  const [loginErrors, loginAction, isLoginPending] = useActionState<
    FormErrors | null,
    FormData
  >(async (_prev, formData) => {
    const email = ((formData.get("email") as string | null) ?? "").trim();
    const password = (formData.get("password") as string | null) ?? "";

    const e: FormErrors = {};
    if (!email) e.email = "請輸入電子郵件";
    if (!password) e.password = "請輸入密碼";
    if (Object.keys(e).length) return e;

    // 模擬後端 Auth 握手
    await new Promise<void>((r) => setTimeout(r, 1000));
    router.push("/profile/user/collection");
    return null;
  }, null);

  // ── 🟢 React 19 useActionState：註冊提交分流管線（含鋼鐵 Regex 邊界與商戶分流攔截）──
  const [registerErrors, registerAction, isRegisterPending] = useActionState<
    FormErrors | null,
    FormData
  >(async (_prev, formData) => {
    const username = ((formData.get("username") as string | null) ?? "").trim();
    const email = ((formData.get("email") as string | null) ?? "").trim();
    const password = (formData.get("password") as string | null) ?? "";
    const confirmPassword =
      (formData.get("confirmPassword") as string | null) ?? "";

    const e: FormErrors = {};

    // 1. 用戶名稱：限英文、數字、底線、連字號，限 3-24 字元長度
    const usernameRegex = /^[A-Za-z0-9_\-]{3,24}$/;
    if (!username) {
      e.username = "請輸入用戶名稱";
    } else if (!usernameRegex.test(username)) {
      e.username =
        "用戶名稱限 3-24 字元，且只可包含英文、數字、底線(_)或連字號(-)";
    }

    if (!email) e.email = "請輸入電子郵件";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "電子郵件格式不正確";

    // 2. 密碼複雜度：大階、小階、數字、特殊符號，限 8-32 字元
    const passwordComplexityRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/])[A-Za-z\d!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]{8,32}$/;
    if (!password) {
      e.password = "請輸入密碼";
    } else if (!passwordComplexityRegex.test(password)) {
      e.password =
        "密碼限 8-32 字元，且必須同時包含大寫英文、小寫英文、數字及特殊符號";
    }

    if (password !== confirmPassword)
      e.confirmPassword = "兩次輸入的密碼不一致";
    if (!agreeTerms) e.agreeTerms = "請同意服務條款及私隱政策";
    if (Object.keys(e).length) return e;

    // 模擬後端 DB QUERY & ALTER
    await new Promise<void>((r) => setTimeout(r, 1200));

    // 如果是用家剔選咗認證商戶，直接攔截成功畫面，切換至高冷黑金提示看板
    if (isMerchant) {
      setIsMerchantSubmitted(true);
      return null;
    }

    toast.success("🎉 帳戶建立成功！");
    router.push("/profile/user/collection");
    return null;
  }, null);

  // 派生錯誤源：依當前分頁直接讀取對應 Action 回傳的錯誤快照
  const errors: FormErrors =
    (tab === "login" ? loginErrors : registerErrors) ?? {};

  const handleTabChange = useCallback((next: Tab) => {
    setTab(next);
    setShowPassword(false);
    setIsMerchant(false);
  }, []);

  const toggleShow = useCallback(() => setShowPassword((v) => !v), []);

  // ── 🟢 核心優化：商戶審批等待提示畫面 ──
  if (isMerchantSubmitted) {
    return (
      <div className="bg-[#26211C] border border-[rgba(212,165,116,0.25)] rounded-2xl p-6 text-left shadow-2xl space-y-4 animate-scaleUp">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <span className="text-[20px]">🏛️</span>
          <h2 className="font-sans font-black text-[17px] text-[#eae1da]">
            認證商戶註冊申請已成功提交
          </h2>
        </div>
        <p className="font-sans text-[13px] text-[#d4c4b7] leading-relaxed">
          平台管理員已收到您的入駐要約申請。由於認證商戶具備開啟私域散件櫥窗、發布大盤出讓及免手續費等高級特權，風控官將於{" "}
          <span className="text-brand font-bold">24 小時內</span> 完成人工初審。
        </p>
        <div className="p-3.5 bg-[#17130f] rounded-xl border border-white/5 font-sans text-[12.5px] text-[#8A8680] leading-relaxed">
          💡 <span className="text-[#eae1da] font-semibold">後續流程：</span>
          審批通過後，系統將自動向您的郵箱發送官方{" "}
          <span className="text-brand font-medium">
            Merchant Account Approved
          </span>{" "}
          核准認證電郵，並附加一串加密的
          <span className="text-[#eae1da] font-semibold">
            一次性憑證 URL
          </span>{" "}
          供您直接進行首次安全登入。
        </div>
        <button
          type="button"
          onClick={() => {
            setIsMerchantSubmitted(false);
            handleTabChange("login");
          }}
          className="w-full h-11 bg-brand hover:bg-brand-hover text-[#17130f] font-sans text-[14px] font-black rounded-xl cursor-pointer transition-colors focus:outline-none"
        >
          返回登入主頁
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 -ml-1 w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:scale-95 transition-all focus:outline-none"
          aria-label="返回上一頁"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="mb-8">
          <h1 className="font-sans text-[26px] font-bold text-text-primary leading-tight">
            {tab === "login" ? "歡迎回來" : "建立帳戶"}
          </h1>
          <p className="mt-1.5 font-sans text-[14px] text-text-secondary leading-relaxed">
            {tab === "login"
              ? "登入以查看您的卡牌收藏與交易記錄"
              : "加入 HKCardVault，開始交易日版精選卡牌"}
          </p>
        </div>

        <div className="relative flex bg-bg-card rounded-lg p-1 mb-8 border border-[rgba(237,232,224,0.08)]">
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
            className={`relative flex-1 h-9 font-sans text-[14px] font-medium rounded-md transition-colors z-10 ${tab === "login" ? "text-brand" : "text-text-secondary hover:text-text-primary"}`}
          >
            登入
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("register")}
            className={`relative flex-1 h-9 font-sans text-[14px] font-medium rounded-md transition-colors z-10 ${tab === "register" ? "text-brand" : "text-text-secondary hover:text-text-primary"}`}
          >
            免費註冊
          </button>
        </div>
      </div>

      {/* ── Login form ─────────────────────────────────────────────────────── */}
      {tab === "login" && (
        <form action={loginAction} noValidate className="space-y-4">
          <Field label="電子郵件" error={errors.email}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="your@email.com"
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
              name="password"
              autoComplete="current-password"
              hasError={!!errors.password}
              showPassword={showPassword}
              onToggleShow={toggleShow}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={remember}
              onChange={() => setRemember((v) => !v)}
            />
            <span className="font-sans text-[13px] text-text-secondary select-none">
              記住我
            </span>
          </div>
          <button
            type="submit"
            disabled={isLoginPending}
            className="w-full h-11 mt-2 rounded-lg bg-brand font-sans text-[15px] font-semibold text-[#17130f] hover:bg-brand-hover active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoginPending ? "登入中…" : "登入"}
          </button>
        </form>
      )}

      {/* ── Register form ──────────────────────────────────────────────────── */}
      {tab === "register" && (
        <form action={registerAction} noValidate className="space-y-4">
          {/* 🟢 頂級加裝：奢華商戶註冊身份分流 Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-[#17130f] rounded-xl border border-white/5 mb-2">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="block font-sans font-bold text-[13px] text-[#eae1da]">
                🏪 申請註冊成為認證商戶
              </span>
            </div>
            <Checkbox
              checked={isMerchant}
              onChange={() => setIsMerchant((v) => !v)}
            />
          </div>

          <Field label="用戶名稱" error={errors.username}>
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="hkcardvaultr_jp"
              className={inputClass(!!errors.username)}
            />
          </Field>
          <Field label="電子郵件" error={errors.email}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="your@email.com"
              className={inputClass(!!errors.email)}
            />
          </Field>
          <Field label="密碼" error={errors.password}>
            <PasswordInput
              name="password"
              autoComplete="new-password"
              placeholder="••••••••（必須包含大小寫英數及符號）"
              hasError={!!errors.password}
              showPassword={showPassword}
              onToggleShow={toggleShow}
            />
          </Field>
          <Field label="確認密碼" error={errors.confirmPassword}>
            <PasswordInput
              name="confirmPassword"
              autoComplete="new-password"
              hasError={!!errors.confirmPassword}
              showPassword={showPassword}
              onToggleShow={toggleShow}
            />
          </Field>
          <div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Checkbox
                  checked={agreeTerms}
                  hasError={!!errors.agreeTerms}
                  onChange={() => setAgreeTerms((v) => !v)}
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
          <button
            type="submit"
            disabled={isRegisterPending}
            className="w-full h-11 mt-2 rounded-lg bg-brand font-sans text-[15px] font-semibold text-[#17130f] hover:bg-brand-hover active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegisterPending
              ? "建立中…"
              : isMerchant
                ? "提交商戶入駐申請 🚀"
                : "免費建立帳戶"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center font-sans text-[12px] text-text-disabled">
        © 2026 HKCardVault · 所有交易受平台監管保障
      </p>
    </div>
  );
}
