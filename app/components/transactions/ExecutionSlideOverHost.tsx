"use client";

import { ExecutionSlideOver } from "@/app/components/transactions/ExecutionSlideOver";
import { useUIStore } from "@/app/store/useUIStore";

export function ExecutionSlideOverHost() {
  const isOpen = useUIStore((state) => state.isExecutionSlideOverOpen);
  const payload = useUIStore((state) => state.executionSlideOverPayload);
  const closeExecutionSlideOver = useUIStore(
    (state) => state.closeExecutionSlideOver,
  );

  if (!payload) {
    return null;
  }

  return (
    <ExecutionSlideOver
      isOpen={isOpen}
      onClose={closeExecutionSlideOver}
      listingId={payload.listingId}
      order={payload.order}
      card={payload.card}
      productId={payload.productId}
    />
  );
}
