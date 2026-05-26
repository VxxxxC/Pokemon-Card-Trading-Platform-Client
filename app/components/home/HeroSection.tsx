import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="relative mt-5 mb-8 rounded-[16px] overflow-hidden min-h-[260px] lg:min-h-[340px] flex items-end"
      aria-labelledby="hero-heading"
    >
      <Image
        src="https://picsum.photos/seed/poke-hero-charizard/800/400"
        alt="Charizard ex SAR — 151 系列"
        fill
        className="object-cover"
        priority
      />
      {/* TODO [MOCK DATA]: Replace picsum placeholder with real card image from Supabase Storage or TCGdex CDN */}
      {/* Mobile: bottom-up gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#17130f] via-[#17130f]/70 to-transparent lg:hidden" />
      {/* Desktop: left-to-right gradient */}
      <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#17130f] via-[#17130f]/70 to-transparent" />
      <div className="relative z-10 p-6 lg:p-10 w-full lg:max-w-[560px]">
        <span className="font-mono text-[11px] text-brand uppercase tracking-widest">
          日版寶可夢卡牌專業交易平台
        </span>
        <h1
          id="hero-heading"
          className="font-sans font-bold text-[28px] lg:text-[36px] text-text-primary leading-tight mt-1 mb-2"
        >
          高分鑑定卡收藏，安心交易
        </h1>
        <p className="font-sans text-[14px] text-text-secondary mb-5 max-w-[360px]">
          實時價格透明、第三方託管保障、專業收藏家社群。
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover min-h-[44px]"
          >
            瀏覽市場
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center h-11 px-6 border border-[rgba(237,232,224,0.12)] text-brand font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-bg-elevated min-h-[44px]"
          >
            立即註冊
          </Link>
        </div>
      </div>
    </section>
  );
}
