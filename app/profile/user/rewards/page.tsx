"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { CheckInCard } from "@/app/components/rewards/CheckInCard";
import { CouponGridSkeleton } from "@/app/components/shared/CouponSkeletons";
// 🟢 核心對接：引入全域統一的奢華黑金分頁組件
import { Pagination } from "@/app/components/ui/Pagination";

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

// ── 🟢 數據庫容量大擴張：注滿大量 mock 數據，完美供 6 Items/Page 進行極限分頁測試 ──
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
    {
      id: "CPN-A-04",
      name: "七夕珍藏流通大禮包券",
      code: "QIXI-TCG-200",
      valueLabel: "HK$ 200",
      minSpendLabel: "全網 C2C 交易滿 HK$2,000 適用",
      expiryDate: "2026年 7月30日",
      type: "cash",
    },
    {
      id: "CPN-A-05",
      name: "夏日祭典 · 散件交易手續費減免券",
      code: "SUMMER-FEE-80",
      valueLabel: "8 折",
      minSpendLabel: "任意稀有度 SAR / UR 散件上架適用",
      expiryDate: "2026年 8月15日",
      type: "auth_discount",
    },
    {
      id: "CPN-A-06",
      name: "港島線卡友見面會 · 專屬現場津貼券",
      code: "HK-MEETUP-50",
      valueLabel: "HK$ 50",
      minSpendLabel: "現場線下面交安全中介單滿 HK$500 適用",
      expiryDate: "2026年 6月20日",
      type: "cash",
    },
    {
      id: "CPN-A-07",
      name: "寶可夢 151 復刻狂歡現金折價券",
      code: "POKE-151-300",
      valueLabel: "HK$ 300",
      minSpendLabel: "限定寶可夢 151 擴充包合約滿 HK$3,000 適用",
      expiryDate: "2026年 7月05日",
      type: "cash",
    },
    {
      id: "CPN-A-08",
      name: "中元慶典 · 閃電發貨免郵補貼券",
      code: "GHOST-FAST-SHIP",
      valueLabel: "免運費",
      minSpendLabel: "標記為閃電發貨賣家滿 HK$400 適用",
      expiryDate: "2026年 8月31日",
      type: "shipping",
    },
    {
      id: "CPN-A-09",
      name: "認證牌組推薦官 · 專屬持倉補貼",
      code: "DECK-MASTER-150",
      valueLabel: "HK$ 150",
      minSpendLabel: "購入認證商戶套裝牌組滿 HK$1,800 適用",
      expiryDate: "2026年 6月25日",
      type: "cash",
    },
    {
      id: "CPN-A-10",
      name: "超夢 ex 特典鑑定全額手續費減免券",
      code: "MEWTWO-AUTH-100",
      valueLabel: "免費鑑定",
      minSpendLabel: "限鑑定特定品相超夢 ex SAR 資產適用",
      expiryDate: "2026年 7月15日",
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
    {
      id: "CPN-B-02",
      name: "2025聖誕狂歡限時免郵券",
      code: "XMAS-2025-MAIL",
      valueLabel: "免運費",
      minSpendLabel: "聖誕節當日全網現貨訂單適用",
      expiryDate: "已於 2025/12/25 使用",
      type: "shipping",
    },
    {
      id: "CPN-B-03",
      name: "新年元旦迎新全網通用折價券",
      code: "NEWYEAR-2026-100",
      valueLabel: "HK$ 100",
      minSpendLabel: "滿 HK$1,000 通用",
      expiryDate: "已於 2026/01/01 使用",
      type: "cash",
    },
    {
      id: "CPN-B-04",
      name: "火紅葉綠懷舊專題滿減券",
      code: "FIRE-LEAF-120",
      valueLabel: "HK$ 120",
      minSpendLabel: "滿 HK$1,200 適用",
      expiryDate: "已於 2026/03/10 使用",
      type: "cash",
    },
    {
      id: "CPN-B-05",
      name: "豐緣地區神獸特別流通補貼券",
      code: "HOENN-LEGEND-80",
      valueLabel: "HK$ 80",
      minSpendLabel: "購買裂空座/固拉多相關卡牌適用",
      expiryDate: "已於 2026/04/15 使用",
      type: "cash",
    },
    {
      id: "CPN-B-06",
      name: "關都御三家典藏手續費券",
      code: "KANTO-STARTER-50",
      valueLabel: "5 折",
      minSpendLabel: "噴火龍/水箭龜/妙蛙花送評適用",
      expiryDate: "已於 2026/05/02 使用",
      type: "auth_discount",
    },
    {
      id: "CPN-B-07",
      name: "閃電發貨服務首次升級體驗券",
      code: "FAST-FIRST-FREE",
      valueLabel: "免運費",
      minSpendLabel: "無門檻限體驗閃電物流適用",
      expiryDate: "已於 2026/05/18 使用",
      type: "shipping",
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
    {
      id: "CPN-C-02",
      name: "2025冬季超級聯賽應援折價券",
      code: "WINTER-LEAGUE-150",
      valueLabel: "HK$ 150",
      minSpendLabel: "滿 HK$1,500 適用",
      expiryDate: "已於 2026/02/28 過期",
      type: "cash",
    },
    {
      id: "CPN-C-03",
      name: "情人節沙奈朵特別企劃現金券",
      code: "VALENTINE-GARD-80",
      valueLabel: "HK$ 80",
      minSpendLabel: "滿 HK$800 適用",
      expiryDate: "已於 2026/02/15 過期",
      type: "cash",
    },
    {
      id: "CPN-C-04",
      name: "甲賀忍蛙 Stellar 登場紀念手續費券",
      code: "FROG-STELLAR-50",
      valueLabel: "5 折",
      minSpendLabel: "星晶特殊規格複驗適用",
      expiryDate: "2026/03/31 過期",
      type: "auth_discount",
    },
    {
      id: "CPN-C-05",
      name: "白銀山巔峰對決流通津貼券",
      code: "SILVER-MT-300",
      valueLabel: "HK$ 300",
      minSpendLabel: "滿 HK$3,500 適用",
      expiryDate: "已於 2025/11/30 過期",
      type: "cash",
    },
    {
      id: "CPN-C-06",
      name: "動漫節前瞻現貨採購預熱券",
      code: "ACG-PRE-50",
      valueLabel: "HK$ 50",
      minSpendLabel: "滿 HK$600 通用",
      expiryDate: "已於 2026/01/15 過期",
      type: "cash",
    },
    {
      id: "CPN-C-07",
      name: "洛奇亞海神降臨鑑定節專用券",
      code: "LUGIA-SEA-FREE",
      valueLabel: "免費鑑定",
      minSpendLabel: "限海神系列合約卡牌送評適用",
      expiryDate: "已於 2026/05/10 過期",
      type: "auth_discount",
    },
  ],
};

// 🟢 嚴格依照意圖：設定每頁 6 個 Item 的 Chunk 限制線
const ITEMS_PER_PAGE = 6;

export default function MemberRewardsPage() {
  const [_missions] = useState<PlatformMission[]>(INITIAL_MISSIONS);
  const [activeTab, setActiveTab] = useState<
    "redeemable" | "redeemed" | "expired"
  >("redeemable");

  // ── 🟢 核心加裝：React 19 零 useEffect 狀態指紋分頁引擎 ──
  // 當 activeTab 切換時，過濾指紋改變，分頁數會主動、非阻塞式歸位回第 1 頁，打穿溢出 Bug
  const [couponPageState, setCouponPageState] = useState({
    page: 1,
    forKey: "",
  });
  const couponFilterFingerprint = activeTab;
  const currentCouponPage =
    couponPageState.forKey === couponFilterFingerprint
      ? couponPageState.page
      : 1;

  const setCurrentCouponPage = (page: number) => {
    setCouponPageState({ page, forKey: couponFilterFingerprint });
    // 翻頁時自帶平滑置頂效果，拯救散戶手指
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isCouponLoading = MOCK_COUPONS[activeTab] === undefined;

  // 完美進行 SSR 環境水合防線看守
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 🟢 數據衍生切片層 (Memoized Coupon Slice)
  const activeCoupons = MOCK_COUPONS[activeTab] || [];
  const totalCouponPages = Math.ceil(activeCoupons.length / ITEMS_PER_PAGE);
  const paginatedCoupons = activeCoupons.slice(
    (currentCouponPage - 1) * ITEMS_PER_PAGE,
    currentCouponPage * ITEMS_PER_PAGE,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col text-[#eae1da]">
      {/* 越獄後自主承載頂部全域看盤外框 */}
      <TopNav />
      <MobileHeader />

      {/* 主線內頁跑道 */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pt-4 pb-28 lg:pb-12 space-y-6 animate-fadeIn">
        {/* 精緻航線麵包屑引流回總覽 */}
        <div className="font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5 select-none">
          <Link
            href="/profile/user"
            className="hover:text-brand transition-colors"
          >
            👤 我的帳號總覽
          </Link>
          <span className="text-text-disabled">/</span>
          <span className="text-text-disabled uppercase">
            Rewards Centre 獎勵中心
          </span>
        </div>

        {/* Page Header Title */}
        <div>
          <h2 className="font-sans font-black text-[22px] lg:text-[26px] text-[#eae1da] tracking-tight">
            會員權益與獎勵中心
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            LOYALTY BONUS & TOKENIZED REWARD HUB
          </p>
        </div>

        {/* 頂部常駐：每日簽到打卡組件 */}
        <CheckInCard />

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

          {/* 完美的平滑無彈跳 Tab 控制器 */}
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
                  className={`pb-3 px-4 font-sans text-[13.5px] font-semibold transition-all relative cursor-pointer ${isActive ? "text-brand" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
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
              <div className="space-y-6">
                {/* 🟢 更換為切片後的分頁隊列數據 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paginatedCoupons.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-[#26211C]/30 border border-[rgba(237,232,224,0.04)] rounded-2xl text-text-disabled font-sans text-[13px]">
                      目前沒有該狀態下的折價券券證
                    </div>
                  ) : (
                    paginatedCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className={`bg-[#26211C] border rounded-2xl p-4 flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                          activeTab === "redeemable"
                            ? "border-[rgba(212,165,116,0.2)] hover:border-brand/40 shadow-sm"
                            : activeTab === "redeemed"
                              ? "border-[rgba(16,185,129,0.15)] opacity-75"
                              : "border-[rgba(237,232,224,0.06)] opacity-50"
                        }`}
                      >
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
                              {activeTab === "redeemable"
                                ? "截止日期"
                                : "流水備註"}
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

                {/* ── 🟢 全域分頁器掛載（每 6 個券證為一頁） ── */}
                <Pagination
                  currentPage={currentCouponPage}
                  totalPages={totalCouponPages}
                  onPageChange={setCurrentCouponPage}
                  itemLabel="張折價券"
                  totalItems={activeCoupons.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  hideControls={false}
                  enableScroll={true}
                  className="mt-6"
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 底部全域手機導航 */}
      <BottomNav />
    </div>
  );
}
