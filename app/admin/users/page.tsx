import type { Metadata } from "next";
import type { UserRole } from "@/app/lib/types/rbac";

export const metadata: Metadata = {
  title: "用戶管理 — PokéTrade JP 後台",
  description: "查看所有用戶，管理權限與封禁狀態",
};

interface PlatformUser {
  id: string;
  name: string;
  handle: string;
  email: string;
  role: UserRole;
  joinDate: string;
  totalTrades: number;
  rating: number;
  isBanned: boolean;
  lastActive: string;
}

// TODO [database]: Replace with Supabase query — fetch all users from `profiles` table with role JOIN, ordered by join_date DESC
const users: PlatformUser[] = [
  { id: "USR-0001", name: "山田 Ren",       handle: "@yamada_ren",     email: "ren@example.com",       role: "USER",             joinDate: "2024/8",  totalTrades: 18,  rating: 4.9,  isBanned: false, lastActive: "5分鐘前"  },
  { id: "USR-0002", name: "田中 Koji",       handle: "@koji_tcg",       email: "koji@kojitcg.jp",       role: "MERCHANT",         joinDate: "2023/11", totalTrades: 247, rating: 4.95, isBanned: false, lastActive: "1小時前"  },
  { id: "USR-0003", name: "鈴木 Haruto",     handle: "@haruto_tcg",     email: "haruto@example.com",    role: "PENDING_MERCHANT", joinDate: "2024/3",  totalTrades: 42,  rating: 4.8,  isBanned: false, lastActive: "2小時前"  },
  { id: "USR-0004", name: "中村 Aiko",       handle: "@aiko_collector", email: "aiko@example.com",      role: "USER",             joinDate: "2024/10", totalTrades: 12,  rating: 4.6,  isBanned: false, lastActive: "昨天"      },
  { id: "USR-0005", name: "Chen Wei",        handle: "@weichen_tcg",    email: "wei@tjtcg.com",         role: "MERCHANT",         joinDate: "2024/1",  totalTrades: 183, rating: 4.85, isBanned: false, lastActive: "3小時前"  },
  { id: "USR-0006", name: "佐藤 Mio",        handle: "@mio_pokéshop",   email: "mio@example.com",       role: "USER",             joinDate: "2025/1",  totalTrades: 3,   rating: 3.5,  isBanned: false, lastActive: "3天前"     },
  { id: "USR-0007", name: "不明用戶 #7",     handle: "@spam_bot_x99",   email: "spam@tempmail.net",     role: "USER",             joinDate: "2025/5",  totalTrades: 0,   rating: 0,    isBanned: true,  lastActive: "1週前"     },
  { id: "USR-0008", name: "高橋 Daichi",     handle: "@daichi_rare",    email: "daichi@daichicard.jp",  role: "MERCHANT",         joinDate: "2023/6",  totalTrades: 312, rating: 4.95, isBanned: false, lastActive: "20分鐘前" },
];

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  USER:             { label: "一般會員",   className: "text-text-secondary bg-bg-elevated" },
  MERCHANT:         { label: "商戶",       className: "text-brand bg-[rgba(212,165,116,0.12)]" },
  ADMIN:            { label: "管理員",     className: "text-warning bg-[rgba(239,68,68,0.10)]" },
  PENDING_MERCHANT: { label: "待審核商戶", className: "text-[#3b9eff] bg-[rgba(59,158,255,0.10)]" },
};

export default function AdminUsersPage() {
  const totalUsers    = users.length;
  const merchantCount = users.filter((u) => u.role === "MERCHANT").length;
  const bannedCount   = users.filter((u) => u.isBanned).length;

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-sans font-bold text-[22px] text-text-primary">用戶管理</h1>
        <p className="font-sans text-[13px] text-text-secondary mt-0.5">
          全局用戶名冊 · 雙向評分 · 封禁管理 · 爭議仲裁
        </p>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {[
          { label: "總用戶",   value: totalUsers,    color: "text-text-primary" },
          { label: "商戶",     value: merchantCount, color: "text-brand" },
          { label: "已封禁",   value: bannedCount,   color: "text-warning" },
          { label: "今日新增", value: 12,            color: "text-success" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-3 text-center">
            <p className={`font-mono font-bold text-[22px] ${color}`}>{value}</p>
            <p className="font-mono text-[11px] text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      {/* TODO [server]: Search input and role filter have no handler — connect to Supabase query with .ilike('name', `%${query}%`) and .eq('role', selectedRole) */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center h-10 bg-bg-card border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-3 shrink-0" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="搜尋用戶名、Handle 或 Email…"
            className="flex-1 h-full bg-transparent px-3 font-sans text-[13px] text-text-primary placeholder-text-disabled focus:outline-none"
          />
        </div>
        <select className="h-10 bg-bg-card border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-mono text-[12px] text-text-secondary focus:outline-none appearance-none">
          <option>全部角色</option>
          <option>一般會員</option>
          <option>商戶</option>
          <option>待審核商戶</option>
        </select>
      </div>

      {/* ── Users Table ─────────────────────────────────────────────── */}
      <section aria-labelledby="users-table-heading">
        <h2 id="users-table-heading" className="sr-only">用戶列表</h2>
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {/* Table header */}
          <div className="hidden lg:grid grid-cols-[1fr_120px_80px_80px_80px_120px] gap-4 px-4 py-2.5 border-b border-[rgba(237,232,224,0.08)]">
            {["用戶", "角色", "成交", "評分", "狀態", "操作"].map((h) => (
              <span key={h} className="font-mono text-[10px] text-text-disabled uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {users.map((user, i) => {
            const { label, className } = ROLE_BADGE[user.role];
            return (
              <div
                key={user.id}
                className={`flex flex-col lg:grid lg:grid-cols-[1fr_120px_80px_80px_80px_120px] lg:items-center gap-2 lg:gap-4 px-4 py-4 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""} ${user.isBanned ? "opacity-50" : ""}`}
              >
                {/* User info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-sans text-[13px] font-semibold text-text-primary">{user.name}</p>
                    {user.isBanned && (
                      <span className="font-mono text-[9px] text-warning bg-[rgba(239,68,68,0.10)] px-1.5 py-0.5 rounded">已封禁</span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-text-secondary">{user.handle} · {user.email}</p>
                  <p className="font-mono text-[10px] text-text-disabled">加入 {user.joinDate} · 最近 {user.lastActive}</p>
                </div>

                {/* Role */}
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded w-fit ${className}`}>{label}</span>

                {/* Trades */}
                <span className="font-mono text-[13px] text-text-primary">{user.totalTrades}</span>

                {/* Rating */}
                <span className={`font-mono text-[13px] ${user.rating >= 4.5 ? "text-brand" : user.rating === 0 ? "text-text-disabled" : "text-text-secondary"}`}>
                  {user.rating === 0 ? "—" : `★ ${user.rating}`}
                </span>

                {/* Status */}
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded w-fit ${user.isBanned ? "text-warning bg-[rgba(239,68,68,0.10)]" : "text-success bg-[rgba(16,185,129,0.10)]"}`}>
                  {user.isBanned ? "已封禁" : "正常"}
                </span>

                {/* Actions */}
                {/* TODO [server]: "詳情" → navigate to /admin/users/[id] detail page (not yet created) */}
                {/* TODO [server]: "封禁"/"解封" must call server action — update profiles.is_banned = true/false in Supabase + invalidate user session */}
                <div className="flex gap-1.5">
                  <button type="button" className="px-2.5 py-1.5 font-mono text-[11px] text-text-secondary border border-[rgba(237,232,224,0.08)] rounded-lg hover:text-text-primary hover:bg-bg-elevated transition-colors">
                    詳情
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1.5 font-mono text-[11px] rounded-lg border transition-colors ${
                      user.isBanned
                        ? "text-success border-success/20 hover:bg-[rgba(16,185,129,0.08)]"
                        : "text-warning border-warning/20 hover:bg-[rgba(239,68,68,0.08)]"
                    }`}
                  >
                    {user.isBanned ? "解封" : "封禁"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
