"use client";

import { Skeleton } from "@/components/ui/skeleton";

// 📦 1. Homepage Sidebar Live Rolling Transaction Feed Wall Skeleton
export function TransactionWallSkeleton() {
  return (
    <div className="space-y-2.5 w-full">
      {/* Map out 4 alternating list rows to simulate dynamic text lengths */}
      {Array.from({ length: 4 }).map((_, i) => {
        // Create variations in stub width percentages to mimic real listings data
        const widths = ["w-1/2", "w-2/3", "w-5/12", "w-7/12"];
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.06)] w-full"
          >
            {/* Status Type badge pill stub (Sold / Bought / Bid) */}
            <Skeleton className="w-12 h-5 bg-[#17130f] rounded shrink-0" />

            {/* Main card info item block stub */}
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className={`h-3.5 bg-[#17130f] rounded ${widths[i % 4]}`} />
              <Skeleton className="h-2.5 bg-[#17130f] rounded w-1/3" />
            </div>

            {/* Price values box stub */}
            <div className="text-right space-y-1.5 shrink-0">
              <Skeleton className="h-3.5 bg-[#17130f] w-14 rounded ml-auto" />
              <Skeleton className="h-2.5 bg-[#17130f] w-10 rounded ml-auto" />
            </div>

            {/* Timestamp notification pill stub (e.g. 3m ago) */}
            <Skeleton className="h-3 bg-[#17130f] w-10 rounded shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

// 💬 2. Cryptographic Chat Room Drawer & Message Bubble Streams Skeleton
export function ChatDrawerSkeleton() {
  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#2e2925] p-4 space-y-5">
      {/* Top Channel Room Info Header Stub */}
      <div className="flex items-center gap-3 border-b border-[rgba(237,232,224,0.06)] pb-4 w-full">
        <Skeleton className="w-10 h-10 rounded-full bg-[#17130f]" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 bg-[#17130f] w-1/3 rounded" />
          <Skeleton className="h-2.5 bg-[#17130f] w-1/2 rounded" />
        </div>
      </div>

      {/* Alternating Chat Message History Bubbles Stream */}
      <div className="flex-1 space-y-4 overflow-hidden w-full py-2">
        {/* Left Side Message Bubble (Counterparty) */}
        <div className="flex items-start gap-2.5 max-w-[80%]">
          <Skeleton className="w-7 h-7 rounded-full bg-[#17130f] shrink-0" />
          <div className="space-y-1.5 w-full">
            <Skeleton className="h-3 bg-[#17130f] w-14 rounded" />
            <Skeleton className="h-10 bg-[#26211C] rounded-2xl w-full border border-white/5" />
          </div>
        </div>

        {/* Right Side Message Bubble (Authenticated User) */}
        <div className="flex items-start justify-end gap-2.5 max-w-[80%] ml-auto text-right">
          <div className="space-y-1.5 w-full flex flex-col items-end">
            <Skeleton className="h-3 bg-[#17130f] w-10 rounded" />
            <Skeleton className="h-8 bg-[rgba(212,165,116,0.15)] rounded-2xl w-3/4 border border-brand/10" />
          </div>
        </div>

        {/* Left Side Message Bubble 2 (Counterparty) */}
        <div className="flex items-start gap-2.5 max-w-[80%]">
          <Skeleton className="w-7 h-7 rounded-full bg-[#17130f] shrink-0" />
          <div className="space-y-1.5 w-full">
            <Skeleton className="h-3 bg-[#17130f] w-16 rounded" />
            <Skeleton className="h-14 bg-[#26211C] rounded-2xl w-5/6 border border-white/5" />
          </div>
        </div>
      </div>

      {/* Bottom Message Input Box Console Stub */}
      <div className="pt-4 border-t border-[rgba(237,232,224,0.06)] w-full flex gap-2">
        <Skeleton className="h-10 bg-[#17130f] rounded-xl flex-1" />
        <Skeleton className="w-14 h-10 bg-[#17130f] rounded-xl shrink-0" />
      </div>
    </div>
  );
}
