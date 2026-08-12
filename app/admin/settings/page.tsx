"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getPlatformFinancialConfig,
  updatePlatformFinancialConfig,
} from "@/app/actions/admin-settings";
import {
  getPlatformLegalForAdmin,
  updatePlatformLegal,
} from "@/app/actions/platform-legal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoutModal } from "@/app/components/profile/LogoutModal";
import {
  DEFAULT_PLATFORM_PRIVACY,
  DEFAULT_PLATFORM_TERMS,
} from "@/lib/platform/platform-legal-config";

export default function AdminSettingsPage() {
  // Financial inputs
  const [commissionRate, setCommissionRate] = useState(8.0);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(true);
  const [isSavingFinancials, setIsSavingFinancials] = useState(false);
  const [appraisalFee, setAppraisalFee] = useState(150);

  // Platform policy terms
  const [termsTitle, setTermsTitle] = useState(DEFAULT_PLATFORM_TERMS.title);
  const [termsBody, setTermsBody] = useState(DEFAULT_PLATFORM_TERMS.body);
  const [privacyTitle, setPrivacyTitle] = useState(DEFAULT_PLATFORM_PRIVACY.title);
  const [privacyBody, setPrivacyBody] = useState(DEFAULT_PLATFORM_PRIVACY.body);
  const [isLoadingLegal, setIsLoadingLegal] = useState(true);
  const [isSavingLegal, setIsSavingLegal] = useState(false);

  // Security settings (admin credentials)
  const [adminEmail, setAdminEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sectionClass =
    "bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5";

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getPlatformFinancialConfig();
      if (cancelled) {
        return;
      }

      if (result.success) {
        setCommissionRate(result.data.commissionRatePercent);
        setAppraisalFee(result.data.appraisalFeeHkd);
      } else {
        toast.error(result.error);
      }
      setIsLoadingFinancials(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getPlatformLegalForAdmin();
      if (cancelled) {
        return;
      }

      if (result.success) {
        setTermsTitle(result.data.terms.title);
        setTermsBody(result.data.terms.body);
        setPrivacyTitle(result.data.privacy.title);
        setPrivacyBody(result.data.privacy.body);
      } else {
        toast.error(result.error);
      }
      setIsLoadingLegal(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFinancials(true);

    const result = await updatePlatformFinancialConfig({
      commissionRatePercent: commissionRate,
      appraisalFeeHkd: appraisalFee,
    });
    setIsSavingFinancials(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setCommissionRate(result.data.commissionRatePercent);
    setAppraisalFee(result.data.appraisalFeeHkd);
    toast.success(
      "✅ 平台財務設定已更新：新訂單結帳將套用新鑑定費；確認收貨後將套用新佣金率。",
    );
  };

  const handleSaveTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLegal(true);

    const result = await updatePlatformLegal({
      terms: { title: termsTitle, body: termsBody },
      privacy: { title: privacyTitle, body: privacyBody },
    });
    setIsSavingLegal(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setTermsTitle(result.data.terms.title);
    setTermsBody(result.data.terms.body);
    setPrivacyTitle(result.data.privacy.title);
    setPrivacyBody(result.data.privacy.body);
    toast.success("📄 平台聲明與交易條款已發佈，/terms 與 /privacy 已更新。");
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
          管理員可調校平台核心佣金、鑑定費與管理員安全設定
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
          設定全平台抽佣比例與單張保管鑑定費用
        </p>

        <form onSubmit={handleSaveFinancials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  disabled={isLoadingFinancials || isSavingFinancials}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
                <span className="font-mono text-[11px] text-text-disabled">
                  %
                </span>
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                {isLoadingFinancials
                  ? "載入中…"
                  : `目前費率：${commissionRate.toFixed(1)}%`}
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
          </div>

          <Button
            type="submit"
            disabled={isLoadingFinancials || isSavingFinancials}
            className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            {isSavingFinancials ? "儲存中…" : "儲存財務設定"}
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
          編修前台服務條款與私隱政策；發佈後即時更新 /terms 與 /privacy
        </p>

        <form onSubmit={handleSaveTerms} className="space-y-4">
          <label className="block font-sans text-[12px] text-text-secondary">
            服務條款
          </label>
          <div className="bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl p-3">
            <textarea
              name="termsBody"
              value={termsBody}
              onChange={(e) => setTermsBody(e.target.value)}
              rows={8}
              disabled={isLoadingLegal || isSavingLegal}
              className="w-full bg-transparent font-sans text-[12px] text-text-primary leading-relaxed placeholder-text-disabled focus:outline-none resize-none"
            />
          </div>

          <label className="block font-sans text-[12px] text-text-secondary">
            私隱政策
          </label>
          <div className="bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl p-3">
            <textarea
              name="privacyBody"
              value={privacyBody}
              onChange={(e) => setPrivacyBody(e.target.value)}
              rows={8}
              disabled={isLoadingLegal || isSavingLegal}
              className="w-full bg-transparent font-sans text-[12px] text-text-primary leading-relaxed placeholder-text-disabled focus:outline-none resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoadingLegal || isSavingLegal}
            className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            {isSavingLegal ? "發佈中…" : "發佈最新條款聲明"}
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
