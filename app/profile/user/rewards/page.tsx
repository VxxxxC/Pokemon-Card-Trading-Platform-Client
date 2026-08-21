"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";

import { getUserRewardCoupons } from "@/app/actions/rewards";
import type {
  CouponCenterTab,
  LockedRewardView,
  UserCouponTab,
  UserCouponView,
} from "@/lib/rewards/mapUserRewardCoupon";

import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { CheckInCard } from "@/app/components/rewards/CheckInCard";
import { RewardNotificationHost } from "@/app/components/rewards/RewardNotificationHost";
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

const EMPTY_WALLET: Record<UserCouponTab, UserCouponView[]> = {
  redeemable: [],
  redeemed: [],
  expired: [],
};

const COUPON_CENTER_TABS: CouponCenterTab[] = [
  "redeemable",
  "locked",
  "redeemed",
  "expired",
];

const COUPON_TAB_LABELS: Record<CouponCenterTab, string> = {
  redeemable: "可領取 / 可使用",
  locked: "可解鎖",
  redeemed: "歷史已使用",
  expired: "不可領用 (已過期)",
};

// 🟢 嚴格依照意圖：設定每頁 6 個 Item 的 Chunk 限制線
const ITEMS_PER_PAGE = 6;

export default function MemberRewardsPage() {
  const [_missions] = useState<PlatformMission[]>(INITIAL_MISSIONS);
  const [walletCoupons, setWalletCoupons] =
    useState<Record<UserCouponTab, UserCouponView[]>>(EMPTY_WALLET);
  const [lockedRewards, setLockedRewards] = useState<LockedRewardView[]>([]);
  const [isCouponLoading, setIsCouponLoading] = useState(true);
  const [couponLoadError, setCouponLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CouponCenterTab>("redeemable");

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
  };

  useEffect(() => {
    let cancelled = false;

    async function loadCoupons() {
      setIsCouponLoading(true);
      setCouponLoadError(null);

      const result = await getUserRewardCoupons();

      if (cancelled) return;

      if (result.success) {
        setWalletCoupons(result.data.wallet);
        setLockedRewards(result.data.locked);
      } else {
        setCouponLoadError(result.error);
        setWalletCoupons(EMPTY_WALLET);
        setLockedRewards([]);
      }

      setIsCouponLoading(false);
    }

    void loadCoupons();

    return () => {
      cancelled = true;
    };
  }, []);

  // 完美進行 SSR 環境水合防線看守
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 🟢 數據衍生切片層 (Memoized Coupon Slice)
  const activeCoupons =
    activeTab === "locked" ? lockedRewards : walletCoupons[activeTab] || [];
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
          <span className="text-text-disabled uppercase">獎勵與任務中心</span>
        </div>

        {/* Page Header Title */}
        <div>
          <h2 className="font-sans font-black text-[22px] lg:text-[26px] text-[#eae1da] tracking-tight">
            會員獎勵與任務中心
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            LOYALTY BONUS & TOKENIZED REWARD HUB
          </p>
        </div>

        {/* 頂部常駐：每日簽到打卡組件 */}
        <CheckInCard />

        <Link
          href="/profile/user/campaigns"
          className="block w-full rounded-2xl border border-brand/30 bg-[rgba(212,165,116,0.08)] px-5 py-4 text-center font-sans font-bold text-[14px] text-brand hover:bg-[rgba(212,165,116,0.14)] transition-colors"
        >
          前往限時搶券 · 積分商城 →
        </Link>

        {/* ── 智能三態 Coupon 中心 ── */}
        <section id="redeem-list" className="space-y-4 pt-2">
          <div>
            <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
              🎟️ 我的全域平台折價券中心
            </h3>
            <p className="font-mono text-[9px] text-[#50453b] uppercase tracking-wider">
              CREDENTIAL COUPON & VOUCHER INVENTORY
            </p>
          </div>

          {/* 完美的平滑無彈跳 Tab 控制器 */}
          <div className="flex border-b border-[rgba(237,232,224,0.08)] overflow-x-auto scrollbar-none">
            {COUPON_CENTER_TABS.map((tab) => {
              const count =
                tab === "locked"
                  ? lockedRewards.length
                  : walletCoupons[tab].length;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-4 font-sans text-[13.5px] font-semibold transition-all relative cursor-pointer shrink-0 ${isActive ? "text-brand" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
                >
                  {COUPON_TAB_LABELS[tab]} ({count})
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 券流列表流 */}
          <div className="pt-2">
            {couponLoadError ? (
              <div className="py-12 text-center bg-[#26211C]/30 border border-[rgba(237,232,224,0.04)] rounded-2xl text-error font-sans text-[13px]">
                {couponLoadError}
              </div>
            ) : isCouponLoading ? (
              <CouponGridSkeleton />
            ) : (
              <div className="space-y-6">
                {/* 🟢 更換為切片後的分頁隊列數據 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paginatedCoupons.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-[#26211C]/30 border border-[rgba(237,232,224,0.04)] rounded-2xl text-text-disabled font-sans text-[13px]">
                      {activeTab === "locked"
                        ? "目前沒有可預覽的解鎖獎勵"
                        : "目前沒有該狀態下的折價券券證"}
                    </div>
                  ) : activeTab === "locked" ? (
                    (paginatedCoupons as LockedRewardView[]).map((reward) => (
                      <div
                        key={reward.id}
                        className="bg-[#26211C] border border-[rgba(237,232,224,0.1)] border-dashed rounded-2xl p-4 flex flex-col justify-between space-y-4 relative overflow-hidden opacity-90"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#50453b]" />
                        <div className="pl-2 space-y-2">
                          <div className="flex items-baseline gap-1.5">
                            <p className="font-mono font-black text-[22px] tracking-tight text-[#d4c4b7]">
                              {reward.valueLabel}
                            </p>
                            <span className="font-mono text-[9px] text-[#50453b] uppercase">
                              LOCKED
                            </span>
                          </div>
                          <div>
                            <h4 className="font-sans font-bold text-[13.5px] text-[#eae1da] truncate">
                              {reward.name}
                            </h4>
                            <p className="font-sans text-[11px] text-[#d4c4b7] mt-0.5">
                              {reward.minSpendLabel}
                            </p>
                          </div>
                        </div>
                        <div className="pl-2 pt-3 border-t border-[rgba(237,232,224,0.06)] space-y-3 font-mono text-[11px]">
                          <div>
                            <span className="text-[#50453b] block text-[9px] uppercase">
                              解鎖條件
                            </span>
                            <span className="text-[#eae1da] font-semibold">
                              {reward.requirementLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="text-[#50453b] block text-[9px] uppercase">
                                進度
                              </span>
                              <span className="text-brand font-bold">
                                {reward.progressLabel}
                              </span>
                            </div>
                            <Link
                              href={reward.ctaHref}
                              className="text-brand font-bold hover:underline"
                            >
                              去完成 →
                            </Link>
                          </div>
                          <p className="text-[#50453b] text-[10px]">
                            {reward.footerNote}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    (paginatedCoupons as UserCouponView[]).map((coupon) => (
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
                  scrollToViewId="redeem-list"
                  scrollBlock="start"
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 底部全域手機導航 */}
      <BottomNav />
      <RewardNotificationHost />
    </div>
  );
}
