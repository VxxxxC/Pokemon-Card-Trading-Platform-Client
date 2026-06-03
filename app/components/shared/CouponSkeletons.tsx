"use client";

import { Skeleton } from "@/components/ui/skeleton";

// 🔥 1. Platform Real-time Active Missions List Skeleton
export function MissionListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-xl p-4 flex justify-between items-start gap-4"
        >
          {/* Left information core stub */}
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 bg-[#17130f] w-12 rounded" />
              <Skeleton className="h-3.5 bg-[#17130f] w-16 rounded" />
            </div>
            <Skeleton className="h-4 bg-[#17130f] w-1/2 rounded-md" />
            <Skeleton className="h-3 bg-[#17130f] w-5/6 rounded" />
          </div>

          {/* Right action control tracking stubs */}
          <div className="text-right shrink-0 flex flex-col justify-between items-end h-full min-h-[64px]">
            <Skeleton className="h-4 bg-[#17130f] w-10 rounded" />
            <Skeleton className="h-7 w-20 bg-[#17130f] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 🎟️ 2. Three-State Credential Coupon Voucher Grid Skeleton
export function CouponGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 flex flex-col justify-between space-y-5 relative overflow-hidden"
        >
          {/* Simulated left ticket boundary accent strip */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#17130f]" />

          {/* Top segment: big monetary/percentage value block */}
          <div className="pl-2 space-y-3">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-7 bg-[#17130f] w-24 rounded-md" />
              <Skeleton className="h-2.5 bg-[#17130f] w-14 rounded" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 bg-[#17130f] w-2/3 rounded-md" />
              <Skeleton className="h-3 bg-[#17130f] w-1/2 rounded" />
            </div>
          </div>

          {/* Bottom segment: security coupon code & timestamp expiry stub */}
          <div className="pl-2 pt-3 border-t border-[rgba(237,232,224,0.06)] flex items-center justify-between w-full">
            <div className="space-y-1">
              <Skeleton className="h-2 bg-[#17130f] w-6 rounded" />
              <Skeleton className="h-4.5 bg-[#17130f] w-16 rounded" />
            </div>
            <div className="space-y-1 text-right flex flex-col items-end">
              <Skeleton className="h-2 bg-[#17130f] w-10 rounded" />
              <Skeleton className="h-3.5 bg-[#17130f] w-20 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
