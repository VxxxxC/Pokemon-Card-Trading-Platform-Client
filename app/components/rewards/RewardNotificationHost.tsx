"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acknowledgeRewardGrants,
  getUnacknowledgedRewardGrants,
} from "@/app/actions/rewards";
import { RewardUnlockedModal } from "@/app/components/rewards/RewardUnlockedModal";
import { useRewardNotificationStore } from "@/app/store/useRewardNotificationStore";

export function RewardNotificationHost() {
  const queue = useRewardNotificationStore((s) => s.queue);
  const isOpen = useRewardNotificationStore((s) => s.isOpen);
  const enqueue = useRewardNotificationStore((s) => s.enqueue);
  const close = useRewardNotificationStore((s) => s.close);
  const clearQueue = useRewardNotificationStore((s) => s.clearQueue);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const refreshPending = useCallback(async () => {
    const result = await getUnacknowledgedRewardGrants();
    if (result.success && result.data.length > 0) {
      enqueue(result.data);
    }
  }, [enqueue]);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const handleClose = useCallback(async () => {
    if (queue.length === 0) {
      close();
      return;
    }

    setIsAcknowledging(true);
    const result = await acknowledgeRewardGrants(
      queue.map((grant) => grant.userRewardId),
    );
    setIsAcknowledging(false);

    if (result.success) {
      clearQueue();
      return;
    }

    close();
  }, [clearQueue, close, queue]);

  return (
    <RewardUnlockedModal
      open={isOpen && queue.length > 0}
      grants={queue}
      onClose={() => void handleClose()}
      isAcknowledging={isAcknowledging}
    />
  );
}
