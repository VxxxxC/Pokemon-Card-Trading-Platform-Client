"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getGamificationStats,
  listPointsRedemptionCatalog,
  redeemPointsCatalogItem,
} from "@/app/actions/rewards";
import { useIsMemberPersonaActive } from "@/app/lib/hooks/useIsMemberPersonaActive";
import type { PointsRedemptionCatalogView } from "@/lib/admin-rewards/types";
import { Pagination } from "@/app/components/ui/Pagination";
import { rewardLabelFromCatalogItem } from "@/lib/rewards/mapPointsRedemptionCatalog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type PointsRedemptionSectionProps = {
  onRedeemed?: () => void;
  paginated?: boolean;
  showHeading?: boolean;
  itemsPerPage?: number;
};

type PointsSort = "points_asc" | "points_desc" | "stock_desc";

const POINTS_PAGE_SIZE = 6;

function sortPointsCatalog(
  items: PointsRedemptionCatalogView[],
  sort: PointsSort,
): PointsRedemptionCatalogView[] {
  const sorted = [...items];
  if (sort === "points_desc") {
    sorted.sort((a, b) => b.pointsCost - a.pointsCost);
    return sorted;
  }
  if (sort === "stock_desc") {
    sorted.sort((a, b) => b.stock - a.stock);
    return sorted;
  }
  sorted.sort((a, b) => a.pointsCost - b.pointsCost);
  return sorted;
}

export function PointsRedemptionSection({
  onRedeemed,
  paginated = false,
  showHeading = true,
  itemsPerPage = POINTS_PAGE_SIZE,
}: PointsRedemptionSectionProps) {
  const isMemberPersonaActive = useIsMemberPersonaActive();
  const [items, setItems] = useState<PointsRedemptionCatalogView[]>([]);
  const [sort, setSort] = useState<PointsSort>("points_asc");
  const [page, setPage] = useState(1);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshCatalog = useCallback(async () => {
    const [catalogResult, statsResult] = await Promise.all([
      listPointsRedemptionCatalog(),
      getGamificationStats(),
    ]);

    if (!catalogResult.success) {
      setItems([]);
      setLoadError(catalogResult.error);
      setIsLoading(false);
      return;
    }

    setItems(catalogResult.data);
    setLoadError(null);
    setIsLoading(false);

    if (statsResult.success) {
      setPointsBalance(statsResult.data.pointsBalance);
    } else if (catalogResult.data[0]) {
      setPointsBalance(catalogResult.data[0].userPointsBalance);
    }
  }, []);

  useEffect(() => {
    if (!isMemberPersonaActive) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      await refreshCatalog();
      if (cancelled) {
        return;
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isMemberPersonaActive, refreshCatalog]);

  if (!isMemberPersonaActive) {
    return null;
  }

  const handleRedeem = (item: PointsRedemptionCatalogView) => {
    if (!item.canRedeem || isPending) {
      return;
    }

    setRedeemingId(item.catalogId);
    startTransition(async () => {
      const result = await redeemPointsCatalogItem(item.catalogId);
      setRedeemingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("兌換成功，優惠券已加入錢包");
      setPointsBalance(result.data.pointsBalance);
      await refreshCatalog();
      onRedeemed?.();
    });
  };

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div>
          <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
            🪙 積分商城
          </h3>
          <p className="font-mono text-[9px] text-[#50453b] uppercase tracking-wider">
            POINTS REDEMPTION STORE
          </p>
        </div>
        <div className="flex items-center gap-2 py-8 justify-center text-text-disabled font-sans text-[13px]">
          <Spinner className="size-4" />
          載入積分商城…
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="space-y-3">
        <div>
          <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
            🪙 積分商城
          </h3>
        </div>
        <div className="py-8 text-center text-error font-sans text-[13px]">
          {loadError}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-8 text-center text-sm text-[#d4c4b7]">
        積分商城暫無可兌換商品
      </section>
    );
  }

  const sortedItems = sortPointsCatalog(items, sort);
  const totalPages = paginated
    ? Math.max(1, Math.ceil(sortedItems.length / itemsPerPage))
    : 1;
  const safePage = Math.min(page, totalPages);
  const visibleItems = paginated
    ? sortedItems.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage)
    : sortedItems;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        {showHeading ? (
          <div>
            <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
              🪙 積分商城
            </h3>
            <p className="font-mono text-[9px] text-[#50453b] uppercase tracking-wider">
              POINTS REDEMPTION STORE
            </p>
          </div>
        ) : (
          <div />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {paginated ? (
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as PointsSort);
                setPage(1);
              }}
              className="h-9 px-2 rounded-lg bg-[#17130f] border border-white/5 font-sans text-[12px] text-text-primary"
            >
              <option value="points_asc">積分由低至高</option>
              <option value="points_desc">積分由高至低</option>
              <option value="stock_desc">庫存優先</option>
            </select>
          ) : null}
          {pointsBalance != null ? (
            <p className="font-mono text-[11px] text-brand">
              可用積分 {pointsBalance.toLocaleString()} PTS
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleItems.map((item) => {
          const soldOut = item.stock <= 0;
          const atUserLimit =
            item.maxRedemptionsPerUser != null &&
            item.userRedemptionCount >= item.maxRedemptionsPerUser;
          const label = rewardLabelFromCatalogItem(item);

          return (
            <div
              key={item.catalogId}
              className="bg-[#26211C] border border-[rgba(237,232,224,0.1)] rounded-2xl p-4 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <p className="font-mono font-black text-[22px] tracking-tight text-[#eae1da]">
                  {label}
                </p>
                <h4 className="font-sans font-bold text-[13.5px] text-[#eae1da]">
                  {item.template.title}
                </h4>
                {item.template.description ? (
                  <p className="font-sans text-[11px] text-[#d4c4b7]">
                    {item.template.description}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[rgba(237,232,224,0.06)]">
                <div className="font-mono text-[11px] text-[#d4c4b7]">
                  <span className="text-brand font-bold">
                    {item.pointsCost.toLocaleString()} PTS
                  </span>
                  <span className="text-[#50453b] mx-1">·</span>
                  <span>
                    {soldOut ? "已兌完" : `剩餘 ${item.stock}`}
                  </span>
                  {item.maxRedemptionsPerUser != null ? (
                    <>
                      <span className="text-[#50453b] mx-1">·</span>
                      <span>
                        已兌 {item.userRedemptionCount}/
                        {item.maxRedemptionsPerUser}
                      </span>
                    </>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!item.canRedeem || isPending}
                  onClick={() => handleRedeem(item)}
                  className="h-8 rounded-lg bg-brand text-[#17130f] font-sans text-[12px] font-bold hover:bg-brand-hover disabled:opacity-50"
                >
                  {redeemingId === item.catalogId ? (
                    <Spinner className="size-3.5" />
                  ) : soldOut ? (
                    "已兌完"
                  ) : atUserLimit ? (
                    "已達上限"
                  ) : (
                    "兌換"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {paginated ? (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          itemLabel="件商品"
          totalItems={sortedItems.length}
          itemsPerPage={itemsPerPage}
          hideControls={totalPages <= 1}
          enableScroll={false}
        />
      ) : null}
    </section>
  );
}
