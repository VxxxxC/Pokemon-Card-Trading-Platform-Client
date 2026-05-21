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
    title: "帳號",
    items: [
      {
        label: "編輯個人資料",
        description: "變更名稱與個人頭像",
      },
      {
        label: "KYC認證",
        description: "認證為商業賣家（審核：0〜3個工作日）",
      },
      {
        label: "付款方式",
        description: "信用卡與銀行轉帳管理",
      },
    ],
  },
  {
    title: "安全性",
    items: [
      {
        label: "變更密碼",
        description: "設定8字元以上的強力密碼",
      },
      {
        label: "兩步驟驗證",
        description: "以SMS驗證保護帳號",
      },
    ],
  },
  {
    title: "通知",
    items: [
      {
        label: "交易通知",
        description: "出價、得標及發貨的即時通知",
      },
      {
        label: "價格提醒",
        description: "追蹤清單的價格變動通知",
      },
    ],
  },
  {
    title: "其他",
    items: [
      {
        label: "語言 / 貨幣",
        description: "繁體中文 · 日圓（¥）",
      },
      {
        label: "隱私政策",
        description: "關於個人資料的處理方式",
      },
      {
        label: "服務條款",
        description: "PokéTrade JP 服務使用條款",
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
