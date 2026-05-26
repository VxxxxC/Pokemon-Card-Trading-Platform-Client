import Link from "next/link";

// TODO [MOCK DATA]: Replace with Supabase query — fetch announcements from `announcements` table ordered by created_at DESC, limit 3
const announcements = [
  {
    id: "ann-001",
    tag: "平台公告",
    title: "PokéTrade JP 正式上線",
    summary: "日版寶可夢卡牌專業交易平台正式啟用，歡迎收藏家及投資者加入。",
    date: "2025/06/01",
  },
  {
    id: "ann-002",
    tag: "交易保障",
    title: "Escrow 託管系統升級",
    summary: "所有交易均透過第三方託管完成付款，買賣雙方均受平台保障。",
    date: "2025/05/28",
  },
  {
    id: "ann-003",
    tag: "新功能",
    title: "實時價格走勢追蹤已上線",
    summary: "首頁新增即時價格走勢欄，掌握市場動態。",
    date: "2025/05/25",
  },
];

export function CommunityNews() {
  return (
    <section className="mb-8" aria-labelledby="news-heading">
      <div className="flex items-center justify-between mb-4">
        <h2
          id="news-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
        >
          最新消息
        </h2>
      </div>
      <div className="space-y-3">
        {announcements.map((item) => (
          <article
            key={item.id}
            className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4 hover:bg-bg-elevated transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.10)] px-2 py-0.5 rounded-[4px]">
                {item.tag}
              </span>
              <span className="font-mono text-[11px] text-text-secondary">
                {item.date}
              </span>
            </div>
            <h3 className="font-sans font-semibold text-[15px] text-text-primary mb-1">
              {item.title}
            </h3>
            <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
              {item.summary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[rgba(237,232,224,0.08)] bg-bg-shell mt-8">
      <div className="max-w-[1200px] mx-auto w-full px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <p className="font-sans font-bold text-[18px] text-text-primary mb-2">
              PokéTrade <span className="text-brand">JP</span>
            </p>
            <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
              日版寶可夢卡牌專業交易平台。安全託管、實時數據、收藏家社群。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-mono text-[11px] text-text-disabled uppercase tracking-widest mb-3">
              快速連結
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/marketplace" className="font-sans text-[13px] text-text-secondary hover:text-brand transition-colors">
                  市場
                </Link>
              </li>
              <li>
                <Link href="/auth" className="font-sans text-[13px] text-text-secondary hover:text-brand transition-colors">
                  登入 / 註冊
                </Link>
              </li>
              <li>
                <Link href="/profile" className="font-sans text-[13px] text-text-secondary hover:text-brand transition-colors">
                  會員中心
                </Link>
              </li>
              <li>
                <Link href="/settings" className="font-sans text-[13px] text-text-secondary hover:text-brand transition-colors">
                  設定
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-mono text-[11px] text-text-disabled uppercase tracking-widest mb-3">
              條款與政策
            </h4>
            <ul className="space-y-2">
              {/* TODO [BACKEND]: Create dedicated policy pages */}
              <li>
                <span className="font-sans text-[13px] text-text-secondary">
                  隱私政策
                </span>
              </li>
              <li>
                <span className="font-sans text-[13px] text-text-secondary">
                  服務條款
                </span>
              </li>
              <li>
                <span className="font-sans text-[13px] text-text-secondary">
                  交易保障政策
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-mono text-[11px] text-text-disabled uppercase tracking-widest mb-3">
              支援
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/settings" className="font-sans text-[13px] text-text-secondary hover:text-brand transition-colors">
                  常見問題 (FAQ)
                </Link>
              </li>
              <li>
                <span className="font-sans text-[13px] text-text-secondary">
                  聯絡我們
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-4 border-t border-[rgba(237,232,224,0.06)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-mono text-[11px] text-text-disabled">
            © 2025 PokéTrade JP. All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-text-disabled">
            Powered by Stripe Connect · Supabase
          </p>
        </div>
      </div>
    </footer>
  );
}
