"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Megaphone, Sparkles, Clock, CheckCircle2, History } from "lucide-react";

import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { Footer } from "@/app/components/navigation/Footer";
import { PwaInlineBanner } from "@/app/components/pwa/PwaInlineBanner";
import { Badge } from "@/components/ui/badge";
import { getAnnouncementStatus } from "@/lib/announcements/status";
import type { PlatformAnnouncement } from "@/lib/announcements/types";

type AnnouncementsPageClientProps = {
  announcements: PlatformAnnouncement[];
};

export function AnnouncementsPageClient({
  announcements,
}: AnnouncementsPageClientProps) {
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  const { activeAnnouncements, pastAnnouncements, now } = useMemo(() => {
    const nowDate = new Date();
    const activeList: PlatformAnnouncement[] = [];
    const pastList: PlatformAnnouncement[] = [];

    announcements.forEach((item) => {
      const status = getAnnouncementStatus(item, nowDate);
      if (status.code === "active") {
        activeList.push(item);
      } else {
        pastList.push(item);
      }
    });

    return {
      activeAnnouncements: activeList,
      pastAnnouncements: pastList,
      now: nowDate,
    };
  }, [announcements]);

  const currentDisplayList =
    activeTab === "active" ? activeAnnouncements : pastAnnouncements;

  return (
    <div className="min-h-[100dvh] bg-bg-page text-text-primary flex flex-col font-sans overflow-x-hidden">
      <TopNav />
      <MobileHeader />
      <PwaInlineBanner />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 py-6 lg:py-10 pb-28 lg:pb-12 space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(237,232,224,0.12)] bg-[#26211C] p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs text-brand">
              <Megaphone className="h-3.5 w-3.5" />
              <span>HKCardVault Official Bulletin</span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2.5">
              📢 平台官方公告與最新活動
            </h1>

            <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed">
              即時掌握 HKCardVault 最新活動折扣、代託管金庫服務升級、行情追蹤系統上線資訊與系統維護通知。
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[rgba(237,232,224,0.08)] pb-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#26211C] border border-[rgba(237,232,224,0.08)]">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-sans text-xs font-bold transition-all ${
                activeTab === "active"
                  ? "bg-brand text-[#17130f] shadow-md"
                  : "text-text-secondary hover:text-text-primary hover:bg-[#2e2925]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>進行中活動</span>
              <Badge
                variant="outline"
                className={`ml-1 font-mono text-[10px] ${
                  activeTab === "active"
                    ? "border-[#17130f]/30 bg-[#17130f]/10 text-[#17130f]"
                    : "border-brand/30 text-brand"
                }`}
              >
                {activeAnnouncements.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-sans text-xs font-bold transition-all ${
                activeTab === "past"
                  ? "bg-brand text-[#17130f] shadow-md"
                  : "text-text-secondary hover:text-text-primary hover:bg-[#2e2925]"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>過往公告歷史</span>
              <Badge
                variant="outline"
                className={`ml-1 font-mono text-[10px] ${
                  activeTab === "past"
                    ? "border-[#17130f]/30 bg-[#17130f]/10 text-[#17130f]"
                    : "border-text-disabled text-text-disabled"
                }`}
              >
                {pastAnnouncements.length}
              </Badge>
            </button>
          </div>

          <p className="font-mono text-xs text-text-disabled">
            顯示項目：{currentDisplayList.length} 則公告
          </p>
        </div>

        {currentDisplayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(237,232,224,0.12)] bg-[#26211C] p-12 text-center">
            <Megaphone className="h-12 w-12 text-text-disabled mb-3" />
            <h3 className="font-sans text-base font-bold text-text-primary">
              目前暫無{activeTab === "active" ? "進行中活動" : "過往公告記錄"}
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              我們會第一時間於此公佈最新寶可夢卡牌交易特惠與平台升級通知。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentDisplayList.map((item) => {
              const status = getAnnouncementStatus(item, now);

              return (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] transition-all duration-300 hover:border-brand/40 hover:bg-[#2e2925] hover:shadow-2xl"
                >
                  <div>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#17130f]">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#26211C] via-transparent to-black/20" />

                      <div className="absolute top-3 left-3">
                        <Badge
                          variant="outline"
                          className={`border text-xs font-bold ${status.badgeClass}`}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className="flex items-center gap-1.5 rounded-full border border-[rgba(237,232,224,0.15)] bg-black/70 backdrop-blur-md px-3 py-1 font-mono text-[11px] font-semibold text-brand">
                          <Clock className="h-3 w-3" />
                          {item.startDate} ~ {item.endDate}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h2 className="font-sans text-base sm:text-lg font-bold text-text-primary leading-snug group-hover:text-brand transition-colors">
                        {item.title}
                      </h2>

                      <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-4 pt-0 flex items-center justify-end">
                    <div className="py-1 font-mono text-[11px] text-text-disabled flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>官方消息</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
