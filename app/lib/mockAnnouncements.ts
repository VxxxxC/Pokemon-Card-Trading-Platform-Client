export interface Announcement {
  id: string;
  title: string;
  imageUrl: string;
  content: string;
  linkUrl?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isActive: boolean;
  priority?: number;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "🔥 HKCardVault 2026 寶可夢盛夏大促 – 高價評分卡限時免手續費交易！",
    imageUrl: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=1200&auto=format&fit=crop",
    content: "即日起至 8 月底，凡上架 PSA 10 / BGS 9.5 以上的高價值寶可夢評分卡，平台交易手續費全免！立即把握機會上架您的珍藏寶可夢卡牌。",
    linkUrl: "/catalog",
    startDate: "2026-07-01",
    endDate: "2026-08-31",
    isActive: true,
    priority: 1,
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-01T10:00:00Z",
  },
  {
    id: "ann-2",
    title: "🏛️ 獨家代託管升級：專業地下金庫級防潮實體保管庫開放申請",
    imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop",
    content: "HKCardVault 聯手香港專業收藏級金庫，提供 24/7 恆溫恆濕極致實體保管服務。通過金庫驗證之卡牌可獲得專屬黃金驗證標章並享受優先媒合！",
    linkUrl: "/admin/campaigns",
    startDate: "2026-07-15",
    endDate: "2026-09-30",
    isActive: true,
    priority: 2,
    createdAt: "2026-07-15T09:00:00Z",
    updatedAt: "2026-07-15T09:00:00Z",
  },
  {
    id: "ann-3",
    title: "📈 全新「AI 評分行情追蹤系統」正式上線",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
    content: "即時掌握日版 SAR / UR / SR 最新大數據走勢圖表！整合日本與國際拍賣市場成交歷史，為您的投資決策提供精準洞察。",
    linkUrl: "/catalog",
    startDate: "2026-07-20",
    endDate: "2026-10-15",
    isActive: true,
    priority: 3,
    createdAt: "2026-07-20T14:30:00Z",
    updatedAt: "2026-07-20T14:30:00Z",
  },
  {
    id: "ann-4",
    title: "⚡ 舊版「狂歡抽卡積分季」活動結算公告",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop",
    content: "上一季積分抽獎活動已順利結算，所有獎勵卡牌已全數發放至獲獎者個人 Vault 帳戶中。感謝各位收藏家熱烈參與！",
    linkUrl: "",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    isActive: true,
    priority: 4,
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-30T23:59:59Z",
  },
];

/**
 * Calculates announcement operational status badge type based on isActive and date range
 */
export function getAnnouncementStatus(announcement: Announcement, now: Date = new Date()): {
  code: "active" | "upcoming" | "expired" | "inactive";
  label: string;
  badgeClass: string;
} {
  if (!announcement.isActive) {
    return {
      code: "inactive",
      label: "已下架",
      badgeClass: "bg-neutral-800/80 text-text-secondary border-neutral-700",
    };
  }

  const start = new Date(announcement.startDate + "T00:00:00");
  const end = new Date(announcement.endDate + "T23:59:59");

  if (now < start) {
    return {
      code: "upcoming",
      label: "未開始",
      badgeClass: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    };
  }

  if (now > end) {
    return {
      code: "expired",
      label: "已過期",
      badgeClass: "bg-neutral-900/80 text-neutral-400 border-neutral-800",
    };
  }

  return {
    code: "active",
    label: "進行中",
    badgeClass: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
  };
}

/**
 * Filter active announcements for Home Page Modal display
 */
export function getActiveAnnouncements(announcements: Announcement[], now: Date = new Date()): Announcement[] {
  return announcements.filter((item) => {
    if (!item.isActive) return false;
    const start = new Date(item.startDate + "T00:00:00");
    const end = new Date(item.endDate + "T23:59:59");
    return now >= start && now <= end;
  });
}
