"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleWishlist } from "@/app/actions/wishlist";
import { useIsMemberPersonaActive } from "@/app/lib/hooks/useIsMemberPersonaActive";
import { MEMBER_PERSONA_FEATURES_BLOCKED_ERROR } from "@/lib/auth/member-persona-features";
import { buildWishlistFavoredKey } from "@/lib/wishlist/grading";

interface WishlistButtonProps {
  productId?: string;
  gradingCompany?: string;
  gradingScore?: string | null;
  trackedPrice?: number | null;
  initialIsFavored?: boolean;
  /** When `null`, skip API and show login toast immediately. */
  currentUserId?: string | null;
  className?: string;
  /** @deprecated Use productId */
  listingId?: string;
}

function showWishlistLoginToast(onAuth: () => void) {
  toast.error("請先登入以使用願望清單", {
    description: "登入或註冊後即可追蹤卡價與願望清單。",
    duration: 8000,
    action: {
      label: "登入 / 註冊",
      onClick: onAuth,
    },
  });
}

export function WishlistButton({
  productId,
  gradingCompany = "RAW",
  gradingScore = "A",
  trackedPrice = null,
  initialIsFavored = false,
  currentUserId,
  className = "",
  listingId,
}: WishlistButtonProps) {
  const router = useRouter();
  const isMemberPersonaActive = useIsMemberPersonaActive();
  const resolvedProductId = (productId ?? listingId ?? "").trim();
  void listingId;

  const [isFavored, setIsFavored] = useState(initialIsFavored);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsFavored(initialIsFavored);
  }, [initialIsFavored]);

  const handleToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!resolvedProductId) return;

      if (!isMemberPersonaActive) {
        toast.error(MEMBER_PERSONA_FEATURES_BLOCKED_ERROR);
        return;
      }

      if (currentUserId === null) {
        showWishlistLoginToast(() => router.push("/auth"));
        return;
      }

      const previous = isFavored;
      setIsFavored(!previous);

      startTransition(async () => {
        const result = await toggleWishlist({
          productId: resolvedProductId,
          gradingCompany,
          gradingScore,
          trackedPrice:
            trackedPrice != null && trackedPrice > 0 ? trackedPrice : null,
        });

        if (!result.success) {
          setIsFavored(previous);
          if (result.error === "請先登入") {
            showWishlistLoginToast(() => router.push("/auth"));
          } else {
            toast.error(result.error);
          }
          return;
        }

        setIsFavored(result.data.isFavored);

        if (result.data.isFavored) {
          toast.success("已加入願望清單", {
            description: "已開始追蹤此卡價格走勢。",
            action: {
              label: "查看清單",
              onClick: () => router.push("/profile/user/collection"),
            },
          });
        }
      });
    },
    [
      currentUserId,
      gradingCompany,
      gradingScore,
      isFavored,
      isMemberPersonaActive,
      resolvedProductId,
      router,
      trackedPrice,
    ],
  );

  if (!isMemberPersonaActive) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isFavored ? "從願望清單移除" : "加入願望清單"}
      aria-pressed={isFavored}
      className={[
        "group/star flex items-center justify-center w-8 h-8 rounded-full",
        "bg-[#17130f]/70 backdrop-blur-sm border border-[rgba(237,232,224,0.12)]",
        "active:scale-90 transition-all duration-200",
        isFavored ? "shadow-[0_0_10px_rgba(212,165,116,0.3)]" : "",
        isPending ? "opacity-70" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isFavored ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 text-brand transition-all duration-200"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 text-text-secondary transition-all duration-200 group-hover/star:text-brand group-hover/star:scale-110"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      )}
    </button>
  );
}

export function isWishlistFavored(
  favoredKeys: ReadonlySet<string> | undefined,
  productId: string,
  gradingCompany: string,
  gradingScore: string | null | undefined,
): boolean {
  if (!favoredKeys || favoredKeys.size === 0) return false;
  return favoredKeys.has(
    buildWishlistFavoredKey(productId, gradingCompany, gradingScore),
  );
}
