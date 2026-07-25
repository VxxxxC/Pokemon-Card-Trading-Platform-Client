"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

export default function AdminSettingsPage() {
  // Financial inputs
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [appraisalFee, setAppraisalFee] = useState(150);
  const [fpsFee, setFpsFee] = useState(0);

  // Security thresholds
  const [maxWithdrawalLimit, setMaxWithdrawalLimit] = useState(50000);
  const [kycWithdrawalThreshold, setKycWithdrawalThreshold] = useState(10000);

  // Platform policy terms
  const [termsText, setTermsText] = useState(
    `歡迎使用 HKCardVault TCG 交易與收藏保管平台。\n\n本平台之交易服務條款修訂如下：\n1. 凡本平台之認證商戶（MERCHANT），每筆交易將扣除 5.0% 的佣金（不包含 Stripe 聯網信用卡通道之 1.4% 第三方交易費）。\n2. 鑑定服務由本平台專業鑑定團隊承接，PSA / BGS 標準單卡鑑定費用為固定 HK$150/張。\n3. 所有提現結算統一於每週五進行人工 FPS 劃撥，目前免除任何銀行轉賬手續費。\n4. 若單筆交易金額超過 HK$10,000，或累計提現達到此金額，用戶必須強制通過 Stripe KYC 與政府證件審批程序，方可繼續發送提現。`,
  );

  // Security settings (admin credentials)
  const [adminEmail, setAdminEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sectionClass =
    "bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5";

  const handleSaveFinancials = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("✅ 核心財務變數已更新！新費率與費用參數已寫入系統核心表。");
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      "🔒 安全風控防線閾值更新成功！所有高額交易與異常提現將受到新防護限制。",
    );
  };

  const handleSaveTerms = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      "📄 平台聲明與交易條款已修訂！新條款已發佈並強制更新至前台用戶協議。",
    );
  };

  // TODO: [Supabase Wiring] Target: supabase.auth.updateUser({ email }) / ({ password })
  // 現階段僅前端驗證與 toast 回饋，未接後端。
  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminEmail.trim() || !emailRegex.test(adminEmail.trim())) {
      toast.error("請輸入有效嘅電郵地址");
      return;
    }
    toast.success("管理員電郵已更新，請重新驗證身份。");
    setAdminEmail("");
  };

  // TODO: [Supabase Wiring] Target: supabase.auth.updateUser({ password })
  // 現階段僅前端驗證與 toast 回饋，未接後端。
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("請輸入新密碼");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("密碼長度至少 8 個字元");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("兩次輸入嘅密碼唔一致");
      return;
    }
    toast.success("管理員密碼已更新，請重新驗證身份。");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-180 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="font-sans font-bold text-[24px] text-text-primary">
          營運設定
        </h1>
        <p className="font-sans text-[13px] text-text-secondary mt-0.5">
          管理員可調校平台核心佣金、安全風控閾值防線與管理員安全設定
        </p>
      </div>

      {/* ── Container 1: 核心財務與費用變數調校 ───────────────────────── */}
      <section aria-labelledby="financials-heading" className={sectionClass}>
        <h2
          id="financials-heading"
          className="font-sans font-bold text-[16px] text-text-primary mb-1"
        >
          核心財務與費用變數調校
        </h2>
        <p className="font-sans text-[12px] text-text-secondary mb-4">
          設定全平台抽佣比例、單張保管鑑定費用，以及 FPS 人手劃撥銷帳手續費
        </p>

        <form onSubmit={handleSaveFinancials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label
                htmlFor="commission-rate"
                className="font-mono text-[11px] text-text-secondary block mb-1.5"
              >
                平台基本交易佣金率
              </Label>
              <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
                <Input
                  id="commission-rate"
                  type="number"
                  value={commissionRate}
                  onChange={(e) =>
                    setCommissionRate(parseFloat(e.target.value))
                  }
                  min={1}
                  max={20}
                  step={0.1}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
                <span className="font-mono text-[11px] text-text-disabled">
                  %
                </span>
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                目前費率：5.0%
              </p>
            </div>

            <div>
              <Label
                htmlFor="appraisal-fee"
                className="font-mono text-[11px] text-text-secondary block mb-1.5"
              >
                單張卡牌保管鑑定費
              </Label>
              <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
                <span className="font-mono text-[11px] text-text-disabled mr-1.5">
                  HK$
                </span>
                <Input
                  id="appraisal-fee"
                  type="number"
                  value={appraisalFee}
                  onChange={(e) => setAppraisalFee(parseInt(e.target.value))}
                  min={50}
                  max={1000}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                包括保險與標準外殼
              </p>
            </div>

            <div>
              <Label
                htmlFor="fps-fee"
                className="font-mono text-[11px] text-text-secondary block mb-1.5"
              >
                FPS 手動劃撥手續費
              </Label>
              <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
                <span className="font-mono text-[11px] text-text-disabled mr-1.5">
                  HK$
                </span>
                <Input
                  id="fps-fee"
                  type="number"
                  value={fpsFee}
                  onChange={(e) => setFpsFee(parseInt(e.target.value))}
                  min={0}
                  max={100}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                設置為 0 表示免收費
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            儲存財務設定
          </Button>
        </form>
      </section>

      {/* ── Container 2: 平台聲明與交易條款編輯器 ─────────────────────── */}
      <section aria-labelledby="terms-heading" className={sectionClass}>
        <h2
          id="terms-heading"
          className="font-sans font-bold text-[16px] text-text-primary mb-1"
        >
          平台聲明與交易條款編輯器
        </h2>
        <p className="font-sans text-[12px] text-text-secondary mb-4">
          編修前台用戶服務協議、商戶提現守則及隱私政策聲明（實時發佈更新）
        </p>

        <form onSubmit={handleSaveTerms} className="space-y-4">
          <div className="bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl p-3">
            <textarea
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              rows={8}
              className="w-full bg-transparent font-sans text-[12px] text-text-primary leading-relaxed placeholder-text-disabled focus:outline-none resize-none"
            />
          </div>

          <Button
            type="submit"
            className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            發佈最新條款聲明
          </Button>
        </form>
      </section>

      {/* ── Container 3: 安全風控防線閾值變更 ─────────────────────────── */}
      <section aria-labelledby="security-heading" className={sectionClass}>
        <h2
          id="security-heading"
          className="font-sans font-bold text-[16px] text-text-primary mb-1"
        >
          安全風控防線閾值變更
        </h2>
        <p className="font-sans text-[12px] text-text-secondary mb-4">
          設定商戶提現、單筆交易安全審核閾值，預防洗錢與假冒交易 (Anti-Fraud)
        </p>

        <form onSubmit={handleSaveSecurity} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="max-withdrawal"
                className="font-mono text-[11px] text-text-secondary block mb-1.5"
              >
                單筆免核准最大提現限額
              </Label>
              <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
                <span className="font-mono text-[11px] text-text-disabled mr-1.5">
                  HK$
                </span>
                <Input
                  id="max-withdrawal"
                  type="number"
                  value={maxWithdrawalLimit}
                  onChange={(e) =>
                    setMaxWithdrawalLimit(parseInt(e.target.value))
                  }
                  min={1000}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                超出此額需人工專案核准
              </p>
            </div>

            <div>
              <Label
                htmlFor="kyc-threshold"
                className="font-mono text-[11px] text-text-secondary block mb-1.5"
              >
                觸發強制 KYC 累計交易額
              </Label>
              <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
                <span className="font-mono text-[11px] text-text-disabled mr-1.5">
                  HK$
                </span>
                <Input
                  id="kyc-threshold"
                  type="number"
                  value={kycWithdrawalThreshold}
                  onChange={(e) =>
                    setKycWithdrawalThreshold(parseInt(e.target.value))
                  }
                  min={1000}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                未過 KYC 者超過此額鎖定交易
              </p>
            </div>
          </div>

          <div className="text-[11px] text-text-secondary border-l-2 border-brand/40 pl-3 bg-bg-elevated/50 rounded-r-lg py-2">
            觸發臨時封禁嘅累計檢報數由系統硬性設定，管理員無法修改。
          </div>

          <Button
            type="submit"
            className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            更新安全風控門檻
          </Button>
        </form>
      </section>

      {/* ── Container 4: 安全設定 ────────────────────────────────────── */}
      <section aria-labelledby="auth-settings-heading" className={sectionClass}>
        <h2
          id="auth-settings-heading"
          className="font-sans font-bold text-[16px] text-text-primary mb-1"
        >
          安全設定
        </h2>
        <p className="font-sans text-[12px] text-text-secondary mb-4">
          更新管理員登入電郵與密碼，變更後需重新驗證身份
        </p>

        <div className="space-y-6">
          <form onSubmit={handleUpdateEmail} className="space-y-3">
            <Label
              htmlFor="admin-email"
              className="font-mono text-[11px] text-text-secondary block"
            >
              管理員電郵
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@hkcv"
                className="flex-1 h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
              />
              <Button
                type="submit"
                className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
              >
                更新電郵
              </Button>
            </div>
          </form>

          <div className="border-t border-[rgba(237,232,224,0.08)]" />

          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="new-password"
                  className="font-mono text-[11px] text-text-secondary block mb-1.5"
                >
                  新密碼
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="輸入新密碼"
                  className="w-full h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                />
              </div>
              <div>
                <Label
                  htmlFor="confirm-password"
                  className="font-mono text-[11px] text-text-secondary block mb-1.5"
                >
                  確認新密碼
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次輸入新密碼"
                  className="w-full h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
            >
              更新密碼
            </Button>
          </form>
        </div>
      </section>

      {/* ── Container 5: Session Control ─────────────────────────────── */}
      <section aria-labelledby="session-ctrl-heading" className={sectionClass}>
        <h2
          id="session-ctrl-heading"
          className="font-sans font-bold text-[15px] text-text-secondary mb-3"
        >
          Session Control
        </h2>
        <div className="bg-bg-page border border-[rgba(237,232,224,0.05)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] text-text-disabled uppercase block">
              管理員身份鑑權
            </span>
            <span className="font-sans text-[12px] text-text-primary mt-0.5 block">
              您目前是以安全最高權限組管理員 (Super Admin) 登入。
            </span>
          </div>
          <div className="shrink-0">
            <LogoutModal />
          </div>
        </div>
      </section>
    </div>
  );
}
