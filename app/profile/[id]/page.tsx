import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TopNav } from '@/app/components/navigation/TopNav';
import { MobileHeader } from '@/app/components/navigation/MobileHeader';
import { BottomNav } from '@/app/components/navigation/BottomNav';
import { LogoutModal } from '@/app/components/profile/LogoutModal';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ProfileIdPageProps {
  params: Promise<{ id: string }>;
}

interface MemberData {
  readonly id: string;
  readonly username: string;
  readonly avatarSeed: string;
  readonly level: string;
  readonly nextLevel: string;
  readonly xpCurrent: number;
  readonly xpNext: number;
  readonly bio: string;
  readonly stats: {
    readonly totalAssetValue: number;
    readonly assetDelta: string;
    readonly assetDeltaDir: 'up' | 'down';
    readonly cardCount: number;
    readonly gradedCards: number;
    readonly rawCards: number;
    readonly creditScore: number;
    readonly completedTrades: number;
  };
  readonly rewards: {
    readonly hasStreakReward: boolean;
    readonly streakDays: number;
    readonly rewardLabel: string;
  };
  readonly settings: {
    readonly has2FA: boolean;
    readonly shippingAddress: {
      readonly code: string;
      readonly line: string;
    };
  };
}

// ─── Data ──────────────────────────────────────────────────────────────────
// TODO: Replace with Supabase query: supabase.from('profiles').select('*').eq('pkt_id', id).single()

const MOCK_MEMBERS: Record<string, MemberData> = {
  'PKT-8839-44A': {
    id: 'PKT-8839-44A',
    username: 'HK_TRADER_01',
    avatarSeed: 'hk-trader-01-tcg',
    level: '高級收藏家',
    nextLevel: '宗師收藏家',
    xpCurrent: 5_750,
    xpNext: 10_000,
    bio: '專注於第一世代 PSA 10 鑑定卡與稀有未開封補充包。交易活躍於港台日三地。',
    stats: {
      totalAssetValue: 14_850_000,
      assetDelta: '+1.2%',
      assetDeltaDir: 'up',
      cardCount: 243,
      gradedCards: 180,
      rawCards: 63,
      creditScore: 99.8,
      completedTrades: 1_204,
    },
    rewards: {
      hasStreakReward: true,
      streakDays: 7,
      rewardLabel: '順豐免運費券 x1',
    },
    settings: {
      has2FA: true,
      shippingAddress: {
        code: '852M1001',
        line: '香港島中西區上環文咸東街 135 號地下 (順豐站)',
      },
    },
  },
};

async function getMemberById(id: string): Promise<MemberData | null> {
  return MOCK_MEMBERS[id] ?? null;
}

// ─── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: ProfileIdPageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) {
    return {
      title: '找不到會員 — PokéTrade JP',
      description: '此會員 ID 不存在或已停用',
    };
  }
  return {
    title: `${member.username} (${member.id}) — PokéTrade JP`,
    description: member.bio,
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ProfileIdPage({ params }: ProfileIdPageProps) {
  const { id } = await params;
  const member = await getMemberById(id);

  // ── 404 state ──
  if (!member) {
    return (
      <div className="min-h-dvh bg-bg-page flex flex-col">
        <TopNav activePath="/profile" />
        <MobileHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-3">
              PKT-404-MBR
            </p>
            <h1 className="font-sans font-bold text-[22px] text-text-primary mb-2">
              找不到此會員
            </h1>
            <p className="font-sans text-[14px] text-text-secondary mb-6">
              ID <span className="font-mono text-brand">{id}</span> 不存在或已停用
            </p>
            <Link
              href="/"
              className="h-10 px-6 bg-brand text-[#17130f] font-sans font-medium text-[14px] rounded-lg inline-flex items-center hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform min-h-11"
            >
              返回首頁
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const xpPct = Math.min((member.xpCurrent / member.xpNext) * 100, 100);
  const xpToNext = (member.xpNext - member.xpCurrent).toLocaleString('zh-HK');

  return (
    <div className="min-h-dvh bg-bg-page flex flex-col">
      <TopNav activePath="/profile" />
      <MobileHeader />

      <main className="flex-1 max-w-300 mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-10">

        {/* ── Page heading ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
              ID: {member.id}
            </p>
            <h1 className="font-sans font-bold text-[22px] text-text-primary">會員中心</h1>
          </div>
          <Link
            href="/settings"
            className="h-9 px-4 font-sans text-[13px] font-medium text-brand border border-[rgba(237,232,224,0.12)] rounded-lg hover:bg-bg-elevated active:scale-[0.98] active:translate-y-px transition-transform inline-flex items-center gap-1.5 min-h-11"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            設定
          </Link>
        </div>

        {/* ── Profile Hero ──────────────────────────────────────────── */}
        <section
          className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl overflow-hidden mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.30)]"
          aria-labelledby="member-username"
        >
          {/* Shimmer banner */}
          <div
            className="h-20 bg-[linear-gradient(90deg,#2e2925_0%,rgba(212,165,116,0.10)_50%,#2e2925_100%)]"
            aria-hidden="true"
          />

          <div className="px-5 pb-5">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative w-20 h-20 rounded-full border-2 border-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.50)] overflow-hidden shrink-0">
                <Image
                  src={`https://picsum.photos/seed/${member.avatarSeed}/80/80`}
                  alt={`${member.username} 的頭像`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <span className="font-mono text-[10px] font-medium text-brand bg-[rgba(212,165,116,0.12)] border border-[rgba(212,165,116,0.20)] px-2.5 py-1 rounded-full">
                {member.level}
              </span>
            </div>

            {/* Identity */}
            <h2
              id="member-username"
              className="font-sans font-bold text-[20px] text-text-primary leading-tight"
            >
              {member.username}
            </h2>
            <p className="font-sans text-[13px] text-text-secondary mt-1 mb-4 leading-relaxed max-w-xl">
              {member.bio}
            </p>

            {/* EXP progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[11px] text-text-disabled">
                  當前: {member.level}
                </span>
                <span className="font-mono text-[11px] text-brand">
                  距離 {member.nextLevel} 還有 {xpToNext} EXP
                </span>
              </div>
              <div
                className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={member.xpCurrent}
                aria-valuemax={member.xpNext}
                aria-label={`EXP 進度：${xpPct.toFixed(0)}%`}
              >
                <div
                  className="h-full bg-brand rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" role="list" aria-label="帳號統計">

          {/* 總資產估值 */}
          <div
            className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.30)]"
            role="listitem"
          >
            <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-2">
              總資產估值
            </p>
            <p className="font-mono font-semibold text-[22px] text-text-primary leading-none mb-1.5">
              ¥{member.stats.totalAssetValue.toLocaleString('zh-HK')}
            </p>
            <p className={`font-mono text-[12px] ${member.stats.assetDeltaDir === 'up' ? 'text-success' : 'text-warning'}`}>
              {member.stats.assetDeltaDir === 'up' ? '▲' : '▼'} {member.stats.assetDelta} (30日)
            </p>
          </div>

          {/* 藏品數量 */}
          <div
            className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.30)]"
            role="listitem"
          >
            <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-2">
              藏品數量
            </p>
            <p className="font-mono font-semibold text-[22px] text-text-primary leading-none mb-1.5">
              {member.stats.cardCount.toLocaleString('zh-HK')} 張
            </p>
            <p className="font-mono text-[11px] text-text-secondary">
              鑑定卡: {member.stats.gradedCards}　裸卡: {member.stats.rawCards}
            </p>
          </div>

          {/* 信用評分 */}
          <div
            className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.30)]"
            role="listitem"
          >
            <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-2">
              信用評分
            </p>
            <p className="font-mono font-semibold text-[22px] text-success leading-none mb-1.5">
              {member.stats.creditScore}%
            </p>
            <p className="font-mono text-[11px] text-text-secondary">
              基於 {member.stats.completedTrades.toLocaleString('zh-HK')} 筆成功交易
            </p>
          </div>
        </div>

        {/* ── Desktop 3:2 split ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

          {/* ── Left: Quick Settings (3/5) ── */}
          <div className="lg:col-span-3">
            <section
              className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.30)]"
              aria-labelledby="quick-settings-heading"
            >
              <h2
                id="quick-settings-heading"
                className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-4"
              >
                快速設定
              </h2>

              {/* 2FA */}
              <div className="flex items-start gap-3 pb-4 border-b border-[rgba(237,232,224,0.08)]">
                <div className="w-9 h-9 rounded-xl bg-bg-elevated border border-[rgba(237,232,224,0.08)] flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#d4a574" strokeWidth="1.5" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    <circle cx="12" cy="16" r="1" fill="#d4a574" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-sans font-medium text-[14px] text-text-primary">
                      雙重身份驗證 (2FA)
                    </p>
                    {member.settings.has2FA ? (
                      <span className="font-mono text-[10px] font-medium text-success bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-full shrink-0">
                        已啟用
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-medium text-warning bg-[rgba(239,68,68,0.10)] px-2 py-0.5 rounded-full shrink-0">
                        未啟用
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
                    使用 Authenticator 應用程式保護您的帳戶與高價值資產。
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="flex items-start gap-3 pt-4">
                <div className="w-9 h-9 rounded-xl bg-bg-elevated border border-[rgba(237,232,224,0.08)] flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#d4c4b7" strokeWidth="1.5" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-sans font-medium text-[14px] text-text-primary">
                      預設收件地址 (順豐)
                    </p>
                    <Link
                      href="/settings"
                      className="font-mono text-[11px] text-brand hover:text-brand-hover transition-colors shrink-0"
                    >
                      編輯
                    </Link>
                  </div>
                  <p className="font-mono text-[11px] text-text-disabled mb-0.5">
                    {member.settings.shippingAddress.code}
                  </p>
                  <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
                    {member.settings.shippingAddress.line}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ── Right: Rewards + Session (2/5) ── */}
          <aside className="lg:col-span-2 space-y-4">

            {/* 待領取獎勵 */}
            {member.rewards.hasStreakReward && (
              <section
                className="bg-bg-card border border-[rgba(212,165,116,0.20)] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.30)]"
                aria-labelledby="rewards-heading"
              >
                <h2
                  id="rewards-heading"
                  className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3"
                >
                  待領取獎勵
                </h2>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(212,165,116,0.12)] border border-[rgba(212,165,116,0.20)] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d4a574" strokeWidth="1.5" aria-hidden="true">
                      <path d="M20 12V22H4V12" />
                      <path d="M22 7H2v5h20V7z" />
                      <path d="M12 22V7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-sans font-medium text-[14px] text-text-primary">
                      {member.rewards.rewardLabel}
                    </p>
                    <p className="font-mono text-[11px] text-brand mt-0.5">
                      連續簽到 {member.rewards.streakDays} 天達成
                    </p>
                  </div>
                </div>

                {/* Claim is a server action placeholder — upgrade to useTransition when Supabase integrated */}
                <form action="#">
                  <button
                    type="submit"
                    className="w-full h-11 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform min-h-11"
                  >
                    立即領取
                  </button>
                </form>
              </section>
            )}

            {/* Session Control */}
            <section
              className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.30)]"
              aria-labelledby="session-heading"
            >
              <h2
                id="session-heading"
                className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3"
              >
                Session Control
              </h2>
              <LogoutModal />
            </section>

          </aside>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
