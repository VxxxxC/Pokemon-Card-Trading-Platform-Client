"use client";

import { useEffect, useMemo, useState } from "react";
import { getUserReviewedMemberOrderIds } from "@/app/actions/reviews";
import { collectMemberOrderIdsFromChatRoom } from "@/app/lib/chat/resolveMemberOrderId";
import type { Message, OfferLedgerEntry } from "@/app/store/useHkCardVaultStore";

type ReviewFetchState = {
  key: string;
  reviewedIds: ReadonlySet<string>;
};

export type RoomReviewedOrderIdsState = {
  reviewedOrderIds: ReadonlySet<string>;
  isReviewLoading: boolean;
};

export function useRoomReviewedOrderIds(
  roomMessages: Message[],
  offers: Record<string, OfferLedgerEntry>,
  submittedReviewOrderIds: ReadonlySet<string>,
): RoomReviewedOrderIdsState {
  const roomOrderIds = useMemo(
    () => collectMemberOrderIdsFromChatRoom(roomMessages, offers),
    [offers, roomMessages],
  );

  const roomOrderIdsKey = roomOrderIds.join(",");
  const [fetchState, setFetchState] = useState<ReviewFetchState | null>(() =>
    roomOrderIds.length === 0
      ? { key: "", reviewedIds: new Set() }
      : null,
  );

  useEffect(() => {
    if (roomOrderIds.length === 0) {
      return;
    }

    let cancelled = false;

    void getUserReviewedMemberOrderIds(roomOrderIds)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setFetchState({
          key: roomOrderIdsKey,
          reviewedIds: new Set(result.success ? result.data : []),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFetchState({
            key: roomOrderIdsKey,
            reviewedIds: new Set(),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [roomOrderIds, roomOrderIdsKey]);

  return useMemo(() => {
    if (roomOrderIds.length === 0) {
      return {
        reviewedOrderIds: new Set(submittedReviewOrderIds),
        isReviewLoading: false,
      };
    }

    if (!fetchState || fetchState.key !== roomOrderIdsKey) {
      return {
        reviewedOrderIds: new Set(submittedReviewOrderIds),
        isReviewLoading: true,
      };
    }

    const merged = new Set(fetchState.reviewedIds);
    for (const orderId of submittedReviewOrderIds) {
      merged.add(orderId);
    }

    return {
      reviewedOrderIds: merged,
      isReviewLoading: false,
    };
  }, [fetchState, roomOrderIds.length, roomOrderIdsKey, submittedReviewOrderIds]);
}
