"use client";

import { Skeleton } from "@/components/ui/skeleton";

// 💼 1. User Dashboard Top Portfolio Analytics 4-Grid Card Skeleton
export function PortfolioStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 space-y-3"
        >
          {/* Metric label stub */}
          <Skeleton className="h-3 bg-[#17130f] w-1/3 rounded" />
          {/* Main big financial asset number value stub */}
          <Skeleton className="h-5.5 bg-[#17130f] w-3/4 rounded-md" />
          {/* Delta profit/loss note label stub */}
          <Skeleton className="h-3 bg-[#17130f] w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

// 🎖️ 2. User Level Tiers & Achievements Progress Skeleton
export function IdentityLevelSkeleton() {
  return (
    <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 space-y-5 w-full">
      {/* Block Title Header Stub */}
      <Skeleton className="h-4 bg-[#17130f] w-24 rounded-md" />

      {/* 5-Tier Circular Badge Train Track Layout */}
      <div className="flex items-center gap-1 overflow-hidden pb-1 select-none w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-2">
              {/* Badge Node Circle */}
              <Skeleton className="w-8 h-8 rounded-full bg-[#17130f]" />
              {/* Badge Label Underneath */}
              <Skeleton className="h-2 bg-[#17130f] w-11 rounded" />
            </div>
            {/* Connector Line between badges */}
            {i < 4 && (
              <Skeleton className="h-px w-6 mx-0.5 bg-[#17130f] mt-[-14px]" />
            )}
          </div>
        ))}
      </div>

      {/* XP Linear Slider Track Bar Stub */}
      <div className="space-y-2 w-full">
        <div className="flex justify-between items-center w-full">
          <Skeleton className="h-3 bg-[#17130f] w-20 rounded" />
          <Skeleton className="h-3 bg-[#17130f] w-24 rounded" />
        </div>
        {/* Main horizontal progress slider bar */}
        <Skeleton className="w-full h-1.5 bg-[#17130f] rounded-full" />
      </div>

      {/* Earned Achievements Medals Horizontal Row */}
      <div className="flex gap-2 overflow-hidden pb-1 w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 flex items-center gap-2 px-2.5 py-1.5 bg-[#17130f] border border-white/5 rounded-lg min-w-[100px]"
          >
            {/* Emoji round circle block stub */}
            <Skeleton className="w-4 h-4 rounded-full bg-[#26211C]" />
            {/* Achievement text label stub */}
            <Skeleton className="h-3 bg-[#26211C] w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
