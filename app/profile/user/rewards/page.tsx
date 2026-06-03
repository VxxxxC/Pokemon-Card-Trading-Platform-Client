"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
// 🟢 直接重用剛剛寫好嘅原子簽到組件
import { CheckInCard } from "@/app/components/rewards/CheckInCard";
import {
  CouponGridSkeleton,
  MissionListSkeleton,
} from "@/app/components/shared/CouponSkeletons";

interface PlatformMission {
  id: string;
  title: string;
  desc: string;
  rewardPoints: number;
  status: "claimable" | "claimed" | "ongoing";
  progressLabel: string;
}

interface UserCoupon {
  id: string;
  name: string;
  code: string;
  valueLabel: string;
  minSpendLabel: string;
  expiryDate: string;
  type: "shipping" | "cash" | "auth_discount";
}

const INITIAL_MISSIONS: PlatformMission[] = [
  {
    id: "MIS-001",
    title: "部署首張現貨資產",
    desc: "在庫存管理中成功上架任意一張 C2C 私人藏品卡牌散件。",
    rewardPoints: 50,
    status: "claimable",
    progressLabel: "1 / 1",
  },
  {
    id: "MIS-002",
    title: "安全中介託管成交",
    desc: "完成首筆全款交割訂單交易，不論買入或賣出。",
    rewardPoints: 150,
    status: "ongoing",
    progressLabel: "0 / 1",
  },
  {
    id: "MIS-003",
    title: "加入全港加密議價聊天群",
    desc: "首次透過 [聯絡對方] 與另一位收藏玩家開啟加密安全對話。",
    rewardPoints: 30,
    status: "claimed",
    progressLabel: "已領取",
  },
  {
    id: "MIS-004",
    title: "大盤資產資深審查官",
    desc: "實時點擊觀看大盤卡牌商品詳情頁累計超過 20 次。",
    rewardPoints: 80,
    status: "ongoing",
    progressLabel: "14 / 20",
  },
];

const MOCK_COUPONS: Record<
  "redeemable" | "redeemed" | "expired",
  UserCoupon[]
> = {
  redeemable: [
    {
      id: "CPN-A-01",
      name: "端午現貨節 · 免運費券",
      code: "SF-FREE-DUANWU",
      valueLabel: "免運費",
      minSpendLabel: "C2C現貨滿 HK$300 適用",
      expiryDate: "2026年 6月30日",
      type: "shipping",
    },
    {
      id: "CPN-A-02",
      name: "專業道館認證商戶 · 現金折價券",
      code: "B2C-CASH-100",
      valueLabel: "HK$ 100",
      minSpendLabel: "認證商戶正價商品滿 HK$1,500 適用",
      expiryDate: "2026年 6月15日",
      type: "cash",
    },
    {
      id: "CPN-A-03",
      name: "官方高級鑑定託管手續費券",
      code: "AUTH-DISC-50",
      valueLabel: "5 折",
      minSpendLabel: "高價值卡牌官方複驗鑑定時適用",
      expiryDate: "2026年 7月10日",
      type: "auth_discount",
    },
  ],
  redeemed: [
    {
      id: "CPN-B-01",
      name: "新手註冊私藏放卡開路禮",
      code: "WELCOME-TCG-50",
      valueLabel: "HK$ 50",
      minSpendLabel: "無門檻全網散件流通通用",
      expiryDate: "已於 2026/05/20 使用",
      type: "cash",
    },
  ],
  expired: [
    {
      id: "CPN-C-01",
      name: "2026春季黑炎卡師大賽特別券",
      code: "SPRING-BLACK-FLAME",
      valueLabel: "HK$ 200",
      minSpendLabel: "滿 HK$2,000 適用",
      expiryDate: "已於 2026/04/30 過期",
      type: "cash",
    },
  ],
};

export default function MemberRewardsPage() {
  const [missions, setMissions] = useState<PlatformMission[]>(INITIAL_MISSIONS);
  const [activeTab, setActiveTab] = useState<
    "redeemable" | "redeemed" | "expired"
  >("redeemable");
  const isMissionLoading = missions.length === 0;
  const isCouponLoading = MOCK_COUPONS[activeTab] === undefined;

  // 拋棄 useState + useEffect 舊寫法，改用 useSyncExternalStore 完美進行 SSR 環境隔離
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  // 領取任務積分
  const handleClaimMissionReward = (id: string, points: number) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "claimed" as const } : m)),
    );
    toast.success("🎉 任務積分兌領成功", {
      description: `+${points} 積分已即時注入您嘅全域資產中心。`,
    });
  };

  return (
    <div className="space-y-8 p-4 lg:p-8 bg-[#17130f] min-h-screen text-[#eae1da]">
      {/* Page Header */}
      <div>
        <h2 className="font-sans font-bold text-[18px] md:text-[22px] text-[#eae1da]">
          會員權益與獎勵專區
        </h2>
        <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
          LOYALTY BONUS & TOKENIZED REWARD HUB
        </p>
      </div>

      {/* 🟢 頂部常駐：引入封裝好嘅每日簽到打卡組件 */}
      <CheckInCard />

      {/* ── 平台活動任務/獎勵記錄狀態看板 ── */}
      <section className="space-y-4">
        <div>
          <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
            🔥 平台實時活動任務清冊
          </h3>
          <p className="font-mono text-[9px] text-[#50453b] uppercase tracking-wider">
            ACTIVE MISSIONS & PERFORMANCE INCENTIVES
          </p>
        </div>

        {isMissionLoading ? (
          <MissionListSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((task) => (
              <div
                key={task.id}
                className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-xl p-4 flex justify-between items-start gap-4 hover:border-[rgba(237,232,224,0.12)] transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[9px] text-[#50453b]">
                      #{task.id}
                    </span>
                    <span className="font-mono text-[10px] text-brand font-bold">
                      +{task.rewardPoints} PTS
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-[14px] text-[#eae1da] truncate">
                    {task.title}
                  </h4>
                  <p className="font-sans text-[12px] text-[#d4c4b7] leading-relaxed">
                    {task.desc}
                  </p>
                </div>

                {/* 任務控制右側按鈕 */}
                <div className="text-right shrink-0 flex flex-col justify-between items-end h-full min-h-[64px]">
                  <span className="font-mono text-[10px] text-[#8A8680] block bg-[#17130f] px-2 py-0.5 rounded border border-white/5">
                    {task.progressLabel}
                  </span>

                  {task.status === "claimable" ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleClaimMissionReward(task.id, task.rewardPoints)
                      }
                      className="h-7 px-3 bg-brand text-[#1A1612] font-sans font-bold text-[11px] rounded-lg hover:bg-[#e8b896] active:scale-95 transition-all cursor-pointer shadow-sm animate-pulse"
                    >
                      🎁 領取獎勵
                    </button>
                  ) : task.status === "claimed" ? (
                    <span className="font-sans text-[11px] text-[#10b981] font-semibold bg-[#10b981]/5 border border-[#10b981]/20 px-2 py-0.5 rounded-lg">
                      ✓ 已成功領取
                    </span>
                  ) : (
                    <span className="font-sans text-[11px] text-[#8A8680] bg-[#17130f] border border-[rgba(237,232,224,0.06)] px-2 py-0.5 rounded-lg font-medium">
                      ⏳ 進行中
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 智能三態 Coupon 中心 ── */}
      <section className="space-y-4 pt-2">
        <div>
          <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
            🎟️ 我的全域平台折價券中心
          </h3>
          <p className="font-mono text-[9px] text-[#50453b] uppercase tracking-wider">
            CREDENTIAL COUPON & VOUCHER INVENTORY
          </p>
        </div>

        {/* 🟢 完美的平滑無彈跳 Tab 控制器 */}
        <div className="flex border-b border-[rgba(237,232,224,0.08)]">
          {(["redeemable", "redeemed", "expired"] as const).map((tab) => {
            const labels = {
              redeemable: "可領取 / 可使用",
              redeemed: "歷史已使用",
              expired: "不可領用 (已過期)",
            };
            const count = MOCK_COUPONS[tab].length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 font-sans text-[13.5px] font-semibold transition-all relative ${isActive ? "text-brand" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
              >
                {labels[tab]} ({count})
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand" />
                )}
              </button>
            );
          })}
        </div>

        {/* 券流列表流 */}
        <div className="pt-2">
          {isCouponLoading ? (
            <CouponGridSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_COUPONS[activeTab].length === 0 ? (
                <div className="col-span-full py-12 text-center bg-[#26211C]/30 border border-[rgba(237,232,224,0.04)] rounded-2xl text-text-disabled font-sans text-[13px]">
                  目前沒有該狀態下的折價券券證
                </div>
              ) : (
                MOCK_COUPONS[activeTab].map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`bg-[#26211C] border rounded-2xl p-4 flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                      activeTab === "redeemable"
                        ? "border-[rgba(212,165,116,0.2)] hover:border-brand/40"
                        : activeTab === "redeemed"
                          ? "border-[rgba(16,185,129,0.15)] opacity-75"
                          : "border-[rgba(237,232,224,0.06)] opacity-50"
                    }`}
                  >
                    {/* 左側高亮剪票邊線模擬 */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        activeTab === "redeemable"
                          ? "bg-brand"
                          : activeTab === "redeemed"
                            ? "bg-[#10b981]"
                            : "bg-[#39342f]"
                      }`}
                    />

                    <div className="pl-2 space-y-2">
                      <div className="flex items-baseline gap-1.5">
                        <p
                          className={`font-mono font-black text-[22px] tracking-tight ${activeTab === "redeemable" ? "text-brand" : "text-[#eae1da]"}`}
                        >
                          {coupon.valueLabel}
                        </p>
                        <span className="font-mono text-[9px] text-[#50453b] uppercase">
                          VOUCHER TOKEN
                        </span>
                      </div>

                      <div>
                        <h4 className="font-sans font-bold text-[13.5px] text-[#eae1da] truncate">
                          {coupon.name}
                        </h4>
                        <p className="font-sans text-[11px] text-[#d4c4b7] mt-0.5">
                          {coupon.minSpendLabel}
                        </p>
                      </div>
                    </div>

                    {/* 底部券碼與截止日期 */}
                    <div className="pl-2 pt-3 border-t border-[rgba(237,232,224,0.06)] flex items-center justify-between flex-wrap gap-2 font-mono text-[11px]">
                      <div>
                        <span className="text-[#50453b] block text-[9px] uppercase">
                          代碼
                        </span>
                        <span className="text-[#eae1da] font-bold select-all bg-[#17130f] px-1.5 py-0.5 rounded border border-white/5">
                          {coupon.code}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#50453b] block text-[9px] uppercase">
                          {activeTab === "redeemable" ? "截止日期" : "流水備註"}
                        </span>
                        <span
                          className={`font-semibold ${activeTab === "redeemable" ? "text-[#d4c4b7]" : activeTab === "redeemed" ? "text-[#10b981]" : "text-error"}`}
                        >
                          {coupon.expiryDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
