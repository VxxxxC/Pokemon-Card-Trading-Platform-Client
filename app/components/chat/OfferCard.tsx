"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  acceptOffer,
  getOfferCardContext,
  modifyOffer,
  type OfferCardContext,
} from "@/app/actions/offers";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  isCatalogImageUrl,
  isValidOfferCardImageUrl,
} from "@/app/lib/chat/offerCardImage";
import type { Tables } from "@/types/supabase";

export type OfferCardMessage = {
  id: string;
  offer_id: string | null;
  content?: string | null;
  room_id?: string | null;
};

export type OfferCardProps = {
  message: OfferCardMessage;
  currentUserId: string | null;
  roomId?: string;
  /** Hydration from Zustand / makeOffer — skips first paint skeleton when present */
  initialContext?: OfferCardContext | null;
};

function formatModifyOfferNotice(newPrice: number): string {
  return `修改了出價需求：HK$ ${newPrice.toLocaleString()}`;
}

function readModifiedCountFromRow(offer: Tables<"offers">): number {
  const value = (offer as Tables<"offers"> & { modified_count?: number })
    .modified_count;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mergeOfferContext(
  base: OfferCardContext,
  offer: Tables<"offers">,
): OfferCardContext {
  return {
    ...base,
    offer: {
      ...base.offer,
      offer_price: offer.offer_price,
      status: offer.status,
      modified_count: readModifiedCountFromRow(offer),
    },
  };
}

function OfferCardThumbnail({
  imageUrl,
  cardName,
}: {
  imageUrl?: string;
  cardName: string;
}) {
  if (!isValidOfferCardImageUrl(imageUrl)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#17130f] px-1 text-center font-mono text-[9px] leading-tight text-text-disabled">
        卡牌圖
      </div>
    );
  }

  const src = imageUrl.trim();

  if (isCatalogImageUrl(src)) {
    return (
      <Image
        src={src}
        alt={cardName}
        fill
        className="object-cover"
        sizes="64px"
      />
    );
  }

  return (
    <img
      src={src}
      alt={cardName}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );
}

export function OfferCard({
  message,
  currentUserId,
  roomId,
  initialContext = null,
}: OfferCardProps) {
  const router = useRouter();
  const activeRoomId = useHkCardVaultStore((state) => state.activeRoomId);
  const setIsChatOpen = useHkCardVaultStore((state) => state.setIsChatOpen);
  const applyOfferModification = useHkCardVaultStore(
    (state) => state.applyOfferModification,
  );
  const applyOfferAccepted = useHkCardVaultStore(
    (state) => state.applyOfferAccepted,
  );

  const resolvedRoomId =
    roomId ?? message.room_id?.trim() ?? activeRoomId;
  const offerId = message.offer_id?.trim() ?? "";

  const [context, setContext] = useState<OfferCardContext | null>(
    initialContext,
  );
  const [isLoadingContext, setIsLoadingContext] = useState(Boolean(offerId));
  const [contextError, setContextError] = useState<string | null>(null);

  const [offerPrice, setOfferPrice] = useState(
    initialContext?.offer.offer_price ?? 0,
  );
  const [offerStatus, setOfferStatus] = useState<
    Tables<"offers">["status"]
  >(initialContext?.offer.status ?? "pending");
  const [modifiedCount, setModifiedCount] = useState(
    initialContext?.offer.modified_count ?? 0,
  );

  const [modifyInput, setModifyInput] = useState(offerPrice);
  const [modifyDialogKey, setModifyDialogKey] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const loadContext = useCallback(async () => {
    if (!offerId) {
      setContextError("此訊息未綁定出價紀錄");
      setIsLoadingContext(false);
      return;
    }

    setIsLoadingContext(true);
    setContextError(null);

    const result = await getOfferCardContext(offerId);
    if (!result.success) {
      setContextError(result.error);
      setIsLoadingContext(false);
      return;
    }

    setContext(result.data);
    setOfferPrice(result.data.offer.offer_price);
    setOfferStatus(result.data.offer.status);
    setModifiedCount(result.data.offer.modified_count);
    setModifyInput(result.data.offer.offer_price);
    setIsLoadingContext(false);
  }, [offerId]);

  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
      setOfferPrice(initialContext.offer.offer_price);
      setOfferStatus(initialContext.offer.status);
      setModifiedCount(initialContext.offer.modified_count);
      setModifyInput(initialContext.offer.offer_price);
    }

    void loadContext();
  }, [initialContext, loadContext]);

  const isBuyer =
    currentUserId != null &&
    context != null &&
    currentUserId === context.offer.buyer_id;
  const isSeller =
    currentUserId != null &&
    context != null &&
    currentUserId === context.sellerId;
  const isPending = offerStatus === "pending";
  const isAccepted = offerStatus === "accepted";
  const isRejected = offerStatus === "rejected";

  const statusBadge = useMemo(() => {
    if (isAccepted) {
      return {
        label: "● 已接受",
        cls: "text-success bg-success/10 border border-success/20",
      };
    }
    if (isRejected) {
      return {
        label: "● 已拒絕",
        cls: "text-error bg-error/10 border border-error/20",
      };
    }
    if (modifiedCount >= 1) {
      return {
        label: "● 出價已修改",
        cls: "text-orange-400 bg-orange-500/20 font-black border border-orange-500/30",
      };
    }
    return {
      label: "● 待確認",
      cls: "text-brand bg-brand/10 border border-brand/20",
    };
  }, [isAccepted, isRejected, modifiedCount]);

  const cardTone = isAccepted
    ? "border-[#10b981]/30 bg-[#1A1612]/90 text-text-disabled shadow-none"
    : isRejected
      ? "border-error/20 bg-error/5 text-text-disabled"
      : "border-brand/25 bg-[rgba(212,165,116,0.06)] text-[#eae1da] shadow-md";

  const handleAccept = async () => {
    if (!offerId || isAccepting) return;

    setIsAccepting(true);
    try {
      const result = await acceptOffer(offerId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setOfferStatus("accepted");
      applyOfferAccepted({
        roomId: resolvedRoomId,
        offerId,
        messageId: result.data.messageId,
      });

      toast.success("🤝 交易協定已達成！", {
        description: "您已成功接受此出價，商品已進入 Hold 貨狀態。",
      });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "接受出價時發生錯誤";
      toast.error(msg);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) return;
    setIsRejecting(true);
    try {
      setOfferStatus("rejected");
      toast.warning("❌ 已拒絕此議價", {
        description: "拒絕出價後端 RPC 尚未部署，此為前端預覽狀態。",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleModifyOffer = async (): Promise<boolean> => {
    if (!offerId || isModifying) return false;

    if (!Number.isFinite(modifyInput) || modifyInput <= 0) {
      toast.error("⚠️ 請輸入有效的出價金額");
      return false;
    }

    if (modifyInput === offerPrice) {
      toast.error("請輸入與目前不同的出價金額");
      return false;
    }

    setIsModifying(true);
    try {
      const result = await modifyOffer(offerId, modifyInput);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }

      const { offer, messageId } = result.data;
      const newPrice = offer.offer_price;
      const newModifiedCount = readModifiedCountFromRow(offer);
      const messageContent = formatModifyOfferNotice(newPrice);
      const storeRoomId =
        context?.offer.room_id?.trim() || resolvedRoomId;

      setOfferPrice(newPrice);
      setModifiedCount(newModifiedCount);
      setModifyInput(newPrice);
      if (context) {
        setContext(mergeOfferContext(context, offer));
      }

      applyOfferModification({
        roomId: storeRoomId,
        offerId,
        newPrice,
        modifiedCount: newModifiedCount,
        messageId,
        messageContent,
      });

      toast.info("🛠️ 出價已修改", {
        description: `已修改報價為 HK$ ${newPrice.toLocaleString()}。`,
      });
      setModifyDialogKey((key) => key + 1);
      return true;
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "修改出價時發生錯誤";
      toast.error(msg);
      return false;
    } finally {
      setIsModifying(false);
    }
  };

  if (!offerId) {
    return (
      <Card className="my-2 w-full border-white/10 bg-[#26211C] text-text-disabled">
        <CardContent className="py-4 text-[12px]">此訊息未綁定出價紀錄。</CardContent>
      </Card>
    );
  }

  if (isLoadingContext && !context) {
    return (
      <Card className="my-2 w-full border-brand/20 bg-[#26211C]">
        <CardContent className="flex items-center justify-center gap-2 py-8 text-text-disabled">
          <Spinner className="size-4 text-brand" />
          <span className="font-mono text-[11px]">載入出價卡片中…</span>
        </CardContent>
      </Card>
    );
  }

  if (contextError && !context) {
    return (
      <Card className="my-2 w-full border-error/30 bg-[#26211C]">
        <CardContent className="space-y-3 py-4">
          <p className="text-[12px] text-error">{contextError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadContext()}
          >
            重新載入
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!context) return null;

  const cardMeta = [
    context.setCode,
    context.cardNumber ?? context.displayId,
  ]
    .filter(Boolean)
    .join(" · ");

  const productHref = `/marketplace/product/${context.productId}`;

  return (
    <Card
      className={`my-2 w-full overflow-hidden border font-sans text-[12.5px] transition-all duration-300 ${cardTone}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-white/5 pb-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand">
            ⚡ 議價出價卡片
          </p>
          <CardTitle className="text-[13px] font-black text-[#eae1da]">
            {context.cardName}
          </CardTitle>
          {cardMeta ? (
            <p className="font-mono text-[10px] text-text-disabled">{cardMeta}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${statusBadge.cls}`}
        >
          {statusBadge.label}
        </span>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        <div className="flex gap-3">
          <div className="relative h-[88px] w-[64px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#17130f]">
            <OfferCardThumbnail
              imageUrl={context.imageUrl}
              cardName={context.cardName}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="leading-relaxed">
              <span className="font-bold text-brand">{context.buyerName}</span>
              <span className="text-text-disabled"> 出價 </span>
              <span className="font-mono text-[15px] font-black text-brand">
                HK$ {offerPrice.toLocaleString()}
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                router.push(productHref);
                setIsChatOpen(false);
              }}
              className="text-left text-[11px] font-bold text-brand underline underline-offset-2 hover:text-[#e8b896]"
            >
              查看商品詳情 →
            </button>
          </div>
        </div>

        {isAccepted ? (
          <Alert className="border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]">
            <AlertDescription className="text-[12px] font-medium leading-relaxed">
              ✅ 賣家已接受出價，商品已成功鎖定（Hold 貨）
            </AlertDescription>
          </Alert>
        ) : null}

        {isPending && isBuyer ? (
          <div className="space-y-1 border-t border-white/5 pt-2">
            <p className="font-mono text-[11px] italic text-text-disabled">
              ⏳ 等待賣家回應中...
            </p>
            {modifiedCount >= 1 ? (
              <p className="font-mono text-[10px] text-text-disabled/80">
                （已達修改上限）
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      {isPending ? (
        <CardFooter className="flex flex-wrap gap-2 border-t border-white/5 bg-transparent px-4 py-3">
          {isSeller ? (
            <>
              <AlertDialog>
                <AlertDialogTrigger
                  disabled={isAccepting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#10b981] px-3 text-[11px] font-bold text-white hover:bg-[#0fa573] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAccepting ? (
                    <>
                      <Spinner className="size-3.5" />
                      處理中…
                    </>
                  ) : (
                    "接受出價"
                  )}
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm rounded-2xl border border-[#10b981]/30 bg-[#26211C] p-6 text-[#eae1da]">
                  <AlertDialogHeader className="text-left">
                    <AlertDialogTitle className="text-[15px] font-black">
                      確認接受出價
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[11px] font-mono uppercase tracking-wider text-[#8A8680]">
                      Accept Offer
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <p className="py-3 text-[12.5px] leading-relaxed text-[#d4c4b7]">
                    您即將以{" "}
                    <span className="font-mono font-black text-[#10b981]">
                      HK$ {offerPrice.toLocaleString()}
                    </span>{" "}
                    接受來自{" "}
                    <span className="font-bold text-brand">
                      {context.buyerName}
                    </span>{" "}
                    的出價。確認後商品將進入 Hold 貨狀態。
                  </p>
                  <div className="flex flex-col gap-2">
                    <AlertDialogAction
                      onClick={() => void handleAccept()}
                      disabled={isAccepting}
                      className="h-11 rounded-xl bg-[#10b981] font-black text-white hover:bg-[#0fa573] disabled:opacity-50"
                    >
                      {isAccepting ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner className="size-4" />
                          接受中…
                        </span>
                      ) : (
                        "確認接受"
                      )}
                    </AlertDialogAction>
                    <AlertDialogCancel className="h-10 rounded-xl border border-white/10 bg-[#120F0C]">
                      返回
                    </AlertDialogCancel>
                  </div>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger
                  disabled={isRejecting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-error/40 bg-transparent px-3 text-[11px] font-bold text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRejecting ? (
                    <>
                      <Spinner className="size-3.5" />
                      處理中…
                    </>
                  ) : (
                    "拒絕出價"
                  )}
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm rounded-2xl border border-[#ef4444]/30 bg-[#26211C] p-6 text-[#eae1da]">
                  <AlertDialogHeader className="text-left">
                    <AlertDialogTitle className="text-[15px] font-black">
                      確認拒絕出價
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[11px] font-mono uppercase tracking-wider text-[#8A8680]">
                      Reject Offer
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <p className="py-3 text-[12.5px] leading-relaxed text-[#d4c4b7]">
                    您即將婉拒{" "}
                    <span className="font-bold text-brand">
                      {context.buyerName}
                    </span>{" "}
                    的 HK$ {offerPrice.toLocaleString()} 出價。
                  </p>
                  <div className="flex flex-col gap-2">
                    <AlertDialogAction
                      onClick={() => void handleReject()}
                      disabled={isRejecting}
                      className="h-11 rounded-xl bg-[#ef4444] font-black text-white hover:bg-[#dc2626] disabled:opacity-50"
                    >
                      確認拒絕
                    </AlertDialogAction>
                    <AlertDialogCancel className="h-10 rounded-xl border border-white/10 bg-[#120F0C]">
                      返回
                    </AlertDialogCancel>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}

          {isBuyer && modifiedCount < 1 ? (
            <AlertDialog key={`modify-offer-${modifyDialogKey}`}>
              <AlertDialogTrigger
                disabled={isModifying}
                render={
                  <button
                    type="button"
                    className="ml-auto inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-orange-500/40 bg-transparent px-3 text-[11px] font-bold text-orange-400 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                }
              >
                {isModifying ? (
                  <>
                    <Spinner className="size-3.5" />
                    送出中…
                  </>
                ) : (
                  "修改出價"
                )}
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm rounded-2xl border border-orange-500/40 bg-[#26211C] p-6 text-[#eae1da]">
                <AlertDialogHeader className="text-left">
                  <AlertDialogTitle className="text-[15px] font-black">
                    修改出價
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[11px] font-mono uppercase tracking-wider text-[#8A8680]">
                    Modify Offer
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-3">
                  <Alert className="border-orange-500/30 bg-orange-500/10 text-orange-400">
                    <AlertDescription className="text-[11.5px] leading-relaxed">
                      ⚠️ 每筆出價僅能修改一次價格，提交後將重新進入賣家複核隊列。
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={`modify-offer-${message.id}`}
                      className="block font-mono text-[10px] uppercase tracking-wide text-[#d4c4b7]"
                    >
                      新出價金額 (HK$)
                    </label>
                    <input
                      id={`modify-offer-${message.id}`}
                      type="number"
                      value={modifyInput}
                      onChange={(event) =>
                        setModifyInput(Number(event.target.value))
                      }
                      className="h-10 w-full rounded-xl border border-orange-500/20 bg-[#17130f] px-3 font-mono text-[13px] text-[#eae1da] focus:border-orange-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <AlertDialogAction
                    type="button"
                    disabled={isModifying}
                    className="h-11 rounded-xl bg-orange-500 font-black text-[#17130f] hover:bg-orange-400 disabled:opacity-50"
                    onClick={() => {
                      void handleModifyOffer();
                    }}
                  >
                    {isModifying ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="size-4" />
                        送出中…
                      </span>
                    ) : (
                      "確認送出"
                    )}
                  </AlertDialogAction>
                  <AlertDialogCancel
                    onClick={() => setModifyInput(offerPrice)}
                    className="h-10 rounded-xl border border-white/10 bg-[#120F0C]"
                  >
                    取消
                  </AlertDialogCancel>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
