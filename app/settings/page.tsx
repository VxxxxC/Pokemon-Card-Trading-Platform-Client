import type { Metadata } from "next";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";

export const metadata: Metadata = {
  title: "設定",
};

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5F6368"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

const settingsSections = [
  {
    title: "アカウント",
    items: [
      {
        label: "プロフィール編集",
        description: "名前・プロフィール画像の変更",
      },
      {
        label: "KYC認証",
        description: "商業売り手として認証（審査: 0〜3営業日）",
      },
      {
        label: "支払い方法",
        description: "クレジットカード・銀行振込の管理",
      },
    ],
  },
  {
    title: "セキュリティ",
    items: [
      {
        label: "パスワード変更",
        description: "8文字以上の強力なパスワードを設定",
      },
      {
        label: "二段階認証",
        description: "SMS認証でアカウントを保護",
      },
    ],
  },
  {
    title: "通知",
    items: [
      {
        label: "取引通知",
        description: "入札・落札・発送のリアルタイム通知",
      },
      {
        label: "価格アラート",
        description: "ウォッチリストの価格変動通知",
      },
    ],
  },
  {
    title: "その他",
    items: [
      {
        label: "言語 / 通貨",
        description: "日本語 · 日本円（¥）",
      },
      {
        label: "プライバシーポリシー",
        description: "個人情報の取り扱いについて",
      },
      {
        label: "利用規約",
        description: "PokéTrade JP サービス利用規約",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] flex flex-col">
      <TopNav activePath="/settings" />
      <MobileHeader />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <h1 className="font-sans font-bold text-[24px] text-[#202124] mb-6">
          設定
        </h1>

        <div className="space-y-6 max-w-2xl">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="font-mono text-[11px] font-medium text-[#5F6368] uppercase tracking-wider mb-2 px-1">
                {section.title}
              </h2>
              <div className="bg-white rounded-[16px] border border-[rgba(226,232,240,0.6)] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                {section.items.map((item, i) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center justify-between px-4 py-4 text-left hover:bg-[#F8F9FA] transition-colors active:scale-[0.99] min-h-[44px] ${
                      i > 0 ? "border-t border-[rgba(226,232,240,0.6)]" : ""
                    }`}
                  >
                    <div>
                      <p className="font-sans font-medium text-[15px] text-[#202124]">
                        {item.label}
                      </p>
                      <p className="font-sans text-[13px] text-[#5F6368] mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRightIcon />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
