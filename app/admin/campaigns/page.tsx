"use client";

import { useState } from "react";

interface CampaignItem {
  id: string;
  name: string;
  type: "首購立減" | "商戶邀請" | "佣金減免" | "特定卡包補貼";
  reward: string;
  rules: string;
  clicks: number;
  redeems: number;
  roi: string;
  status: "active" | "scheduled" | "expired";
  createdAt: string;
}

const initialCampaigns: CampaignItem[] = [
  {
    id: "CMP-01",
    name: "2026年夏季首購禮",
    type: "首購立減",
    reward: "立減 HK$100",
    rules: "單筆交易滿 HK$1000 可用，限每人領一次，限綁定信用卡實名用戶",
    clicks: 3820,
    redeems: 1240,
    roi: "284%",
    status: "active",
    createdAt: "2026/06/01",
  },
  {
    id: "CMP-02",
    name: "商戶春季入駐紅包",
    type: "商戶邀請",
    reward: "提現免手續費券 * 3",
    rules: "邀請 1 個實名商戶且其上架 5 件卡牌，贈送給邀請人",
    clicks: 1240,
    redeems: 320,
    roi: "192%",
    status: "active",
    createdAt: "2026/05/15",
  },
  {
    id: "CMP-03",
    name: "夜巡 (sv6a) 單卡免佣",
    type: "佣金減免",
    reward: "免 5% 交易佣金",
    rules: "只限交易 sv6a 夜巡特別盒/單卡，每筆免佣上限 HK$200",
    clicks: 5820,
    redeems: 1840,
    roi: "412%",
    status: "active",
    createdAt: "2026/06/10",
  },
  {
    id: "CMP-04",
    name: "2025聖誕狂歡節",
    type: "特定卡包補貼",
    reward: "全場免運費",
    rules: "聖誕當日全場通用，平台定額補貼 HK$30 運費",
    clicks: 9420,
    redeems: 4200,
    roi: "154%",
    status: "expired",
    createdAt: "2025/12/24",
  },
];

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(initialCampaigns);
  const [notif, setNotif] = useState<string | null>(null);

  // Form states
  const [campName, setCampName] = useState("");
  const [campType, setCampType] = useState<
    "首購立減" | "商戶邀請" | "佣金減免" | "特定卡包補貼"
  >("首購立減");
  const [campReward, setCampReward] = useState("");
  const [campRules, setCampRules] = useState("");
  const [campLimit, setCampLimit] = useState("限每人一次且實名認證");

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || !campReward || !campRules) {
      showNotification("❌ 請填寫活動名稱、獎勵內容及限制規則！");
      return;
    }

    const newCamp: CampaignItem = {
      id: `CMP-${Math.floor(10 + Math.random() * 90)}`,
      name: campName,
      type: campType,
      reward: campReward,
      rules: `${campRules} (限制: ${campLimit})`,
      clicks: 0,
      redeems: 0,
      roi: "0%",
      status: "scheduled",
      createdAt: new Date().toLocaleDateString("zh-TW"),
    };

    setCampaigns([newCamp, ...campaigns]);
    showNotification(
      `✅ 活動範本 "${campName}" 建立成功！目前狀態為：預排發佈 (Scheduled)。`,
    );

    // Reset Form
    setCampName("");
    setCampReward("");
    setCampRules("");
    setCampLimit("限每人一次且實名認證");
  };

  const handleToggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "active" ? "expired" : "active";
          return { ...c, status: nextStatus };
        }
        return c;
      }),
    );
    showNotification(`已手動變更活動 ${id} 的發佈狀態。`);
  };

  // Metrics calculation
  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const totalRedeems = campaigns.reduce((acc, c) => acc + c.redeems, 0);
  const averageRoi = "260.5%";

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">
            積分與任務活動
          </h1>
          <p className="font-sans text-xs text-text-secondary mt-0.5">
            <div>建立、發行全平台營銷活動，配置各項積分任務與佣金折扣</div>
            <div>營銷 ROI 精準監控</div>
          </p>
        </div>
      </div>

      {/* ── Notification Toast ────────────────────────────────────────── */}
      {notif && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#2e2925] border-l-4 border-brand px-4 py-3 rounded shadow-xl animate-fade-in">
          <span className="text-brand font-sans text-sm">🎯</span>
          <span className="font-sans text-xs text-text-primary">{notif}</span>
        </div>
      )}

      {/* ── ROI 與核銷分析面板 Metrics ─────────────────────────────────── */}
      <section aria-labelledby="roi-heading">
        <h2
          id="roi-heading"
          className="font-sans font-semibold text-[15px] text-text-secondary mb-3"
        >
          活動 ROI 與核銷分析面板
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "活躍活動件數 (ACTIVE)",
              value: `${activeCount} 個`,
              color: "text-brand",
            },
            {
              label: "全平台累計核銷 (REDEEMS)",
              value: `${totalRedeems.toLocaleString("zh-TW")} 次`,
              color: "text-success",
            },
            { label: "平均營銷 ROI", value: averageRoi, color: "text-brand" },
            {
              label: "營銷專項補貼池",
              value: "HK$ 150,000",
              color: "text-text-primary",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-3.5 text-center"
            >
              <p className={`font-mono font-bold text-[22px] ${color}`}>
                {value}
              </p>
              <p className="font-mono text-[11px] text-text-secondary mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Split View Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* Left: Campaign Template Creator Form */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 space-y-4">
          <div>
            <h2 className="font-sans font-bold text-[16px] text-text-primary">
              新活動範本發行
            </h2>
            <p className="font-sans text-[12px] text-text-secondary mt-0.5">
              快速配置獎勵內容、限制門檻，發行立即同步至前台「任務活動」中
            </p>
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-3.5">
            <div>
              <label className="font-mono text-[11px] text-text-secondary block mb-1">
                活動名稱 <span className="text-warning">*</span>
              </label>
              <input
                type="text"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                placeholder="例：秋季新卡包集章免佣"
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[11px] text-text-secondary block mb-1">
                活動類型
              </label>
              <select
                value={campType}
                onChange={(e) =>
                  setCampType(e.target.value as CampaignItem["type"])
                }
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-2 font-sans text-[12px] text-text-primary focus:outline-none appearance-none"
              >
                <option value="首購立減">首購立減紅包 (拉新)</option>
                <option value="商戶邀請">商戶邀請獎勵 (商家)</option>
                <option value="佣金減免">熱門卡包交易減免 (促銷)</option>
                <option value="特定卡包補貼">全場滿減/運費補貼</option>
              </select>
            </div>

            <div>
              <label className="font-mono text-[11px] text-text-secondary block mb-1">
                獎勵內容配置 <span className="text-warning">*</span>
              </label>
              <input
                type="text"
                value={campReward}
                onChange={(e) => setCampReward(e.target.value)}
                placeholder="例：免 5% 佣金券 / 立減 HK$150"
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[11px] text-text-secondary block mb-1">
                限制與核銷門檻 <span className="text-warning">*</span>
              </label>
              <textarea
                value={campRules}
                onChange={(e) => setCampRules(e.target.value)}
                placeholder="例：限單筆交易滿 HK$1000 且卡包為 sv6a 夜巡，限實名認證..."
                rows={3}
                className="w-full bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl p-3 font-sans text-[12px] text-text-primary focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="font-mono text-[11px] text-text-secondary block mb-1">
                防刷/反欺詐風控機制
              </label>
              <select
                value={campLimit}
                onChange={(e) => setCampLimit(e.target.value)}
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-2 font-sans text-[12px] text-text-primary focus:outline-none appearance-none"
              >
                <option value="限每人一次且實名認證">
                  限每人一次且必須過 KYC 實名
                </option>
                <option value="限綁定相同 Stripe 信用卡">
                  限綁定相同 Stripe 信用卡與裝置
                </option>
                <option value="限商戶提現專用，不可轉讓">
                  限商戶提現抵扣，防刷機制級別最高
                </option>
                <option value="無特別防刷限制">
                  不限制 (適用無資金風險之活動)
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform shadow-lg shadow-brand/10"
            >
              🚀 建立並預排發佈
            </button>
          </form>
        </section>

        {/* Right: Campaign list & Performance tracking */}
        <section aria-labelledby="performance-heading" className="space-y-3">
          <h2
            id="performance-heading"
            className="font-sans font-bold text-[15px] text-text-secondary"
          >
            行銷活動核銷明細與 ROI 列表
          </h2>

          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-4 border-b border-[rgba(237,232,224,0.06)] last:border-b-0 hover:bg-bg-hover transition-colors flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-3 w-full flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[10px] text-text-disabled">
                        #{camp.id}
                      </span>
                      <h3 className="font-sans font-semibold text-[14px] text-text-primary">
                        {camp.name}
                      </h3>
                      <span className="font-mono text-[9px] text-brand bg-[rgba(212,165,116,0.12)] px-2 py-0.5 rounded border border-brand/15">
                        {camp.type}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-text-disabled">
                      限制規則：{camp.rules}
                    </p>
                    <p className="font-mono text-[10px] text-text-disabled mt-1">
                      創建日期：{camp.createdAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                        camp.status === "active"
                          ? "text-success bg-[rgba(16,185,129,0.12)] border-success/20"
                          : camp.status === "scheduled"
                            ? "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20"
                            : "text-text-disabled bg-bg-elevated border-transparent"
                      }`}
                    >
                      {camp.status === "active"
                        ? "進行中"
                        : camp.status === "scheduled"
                          ? "待開始"
                          : "已結束"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(camp.id)}
                      className="h-7 px-2.5 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-lg font-mono text-[10px] text-text-secondary hover:text-text-primary transition-all active:scale-[0.98]"
                    >
                      {camp.status === "active" ? "關閉" : "開啟"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 bg-bg-page border border-[rgba(237,232,224,0.05)] rounded-xl p-3 text-center font-mono text-[11px]">
                  <div>
                    <span className="text-text-disabled text-[9px] block uppercase">
                      獎勵
                    </span>
                    <span className="text-brand font-semibold block mt-0.5">
                      {camp.reward}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-disabled text-[9px] block uppercase">
                      曝光點擊
                    </span>
                    <span className="text-text-primary font-bold block mt-0.5">
                      {camp.clicks}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-disabled text-[9px] block uppercase">
                      核銷次數
                    </span>
                    <span className="text-success font-bold block mt-0.5">
                      {camp.redeems}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-disabled text-[9px] block uppercase">
                      精準 ROI
                    </span>
                    <span className="text-brand font-black block mt-0.5">
                      {camp.roi}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
