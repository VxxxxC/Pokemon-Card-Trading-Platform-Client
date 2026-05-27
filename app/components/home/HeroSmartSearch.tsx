"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PwaInstallButton } from "@/app/components/pwa/PwaInstallButton";

type CardCatalogEntry = {
  code: string;
  name: string;
  rarity: "SAR" | "UR" | "SR" | "AR";
  image: string;
};

// TODO: [database] Replace with Supabase `card_catalog` query (cached) + Bunny CDN images.
const MOCK_CATALOG: CardCatalogEntry[] = [
  {
    code: "SV8a-123",
    name: "ピカチュウ AR",
    rarity: "AR",
    image: "https://picsum.photos/seed/sv8a-123/720/480",
  },
  {
    code: "SV8a-205",
    name: "リザードン ex SAR",
    rarity: "SAR",
    image: "https://picsum.photos/seed/sv8a-205/720/480",
  },
  {
    code: "SV8a-198",
    name: "ミュウツー ex SAR",
    rarity: "SAR",
    image: "https://picsum.photos/seed/sv8a-198/720/480",
  },
  {
    code: "SV6a-109",
    name: "ブラッキー ex SAR",
    rarity: "SAR",
    image: "https://picsum.photos/seed/sv6a-109/720/480",
  },
  {
    code: "SV2a-215",
    name: "ピカチュウ AR",
    rarity: "AR",
    image: "https://picsum.photos/seed/sv2a-215/720/480",
  },
  {
    code: "SV2a-182",
    name: "リザードン ex SAR",
    rarity: "SAR",
    image: "https://picsum.photos/seed/sv2a-182/720/480",
  },
  {
    code: "SV4-301",
    name: "コライドン ex SAR",
    rarity: "SAR",
    image: "https://picsum.photos/seed/sv4-301/720/480",
  },
];

const QUICK_FILTERS = [
  { id: "popular", label: "🔥 人氣女角", query: "人氣女角" },
  { id: "zard", label: "🐉 噴火龍系列", query: "Charizard" },
  { id: "sar", label: "✨ SAR", query: "SAR" },
  { id: "ur", label: "UR", query: "UR" },
  { id: "sr", label: "SR", query: "SR" },
  { id: "ar", label: "AR", query: "AR" },
] as const;

export function HeroSmartSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return MOCK_CATALOG.filter((entry) => {
      return (
        entry.code.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        entry.rarity.toLowerCase() === q
      );
    }).slice(0, 6);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(event.target as Node)) setIsOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const onSubmit = () => {
    const q = query.trim();
    if (!q) return;
    // TODO: [server] Replace with unified search route + query params.
    router.push(`/marketplace?q=${encodeURIComponent(q)}`);
    setIsOpen(false);
  };

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden rounded-[20px] border border-[rgba(237,232,224,0.08)] bg-bg-card shadow-[0_14px_44px_rgba(0,0,0,0.55)]"
      aria-labelledby="home-hero-heading"
    >
      <div className="absolute inset-0">
        <Image
          src="https://picsum.photos/seed/home-hero-foil/1280/720"
          alt=""
          fill
          priority
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-page via-bg-page/55 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,165,116,0.22),transparent_55%)]" />
      </div>

      <div className="relative z-10 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-brand uppercase tracking-[0.20em]">
              智能搜尋 · 快速狙擊
            </p>
            <h1
              id="home-hero-heading"
              className="mt-1 font-sans text-[26px] sm:text-[30px] lg:text-[36px] font-bold text-text-primary leading-tight"
            >
              直接輸入卡牌編號，秒速定位現貨
            </h1>
            <p className="mt-2 font-sans text-[14px] text-text-secondary max-w-[52ch]">
              例：<span className="font-mono text-text-primary">SV8a-123</span>。支援稀有度與系列關鍵字快速篩選。
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <PwaInstallButton size="sm" />
          </div>
        </div>

        <div className="mt-5">
          <div className="relative">
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit();
                    if (e.key === "Escape") setIsOpen(false);
                  }}
                  placeholder="輸入卡牌編號（例如 SV8a-123）"
                  className="w-full h-12 min-h-[48px] rounded-2xl bg-bg-page/70 backdrop-blur border border-[rgba(237,232,224,0.12)] px-4 font-sans text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/60"
                  aria-label="卡牌編號搜尋"
                  autoComplete="off"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-text-disabled">
                  ⏎
                </span>
              </div>
              <button
                type="button"
                onClick={onSubmit}
                className="h-12 min-h-[48px] px-5 rounded-2xl bg-brand text-bg-page font-sans text-[14px] font-semibold hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform"
              >
                搜尋
              </button>
            </div>

            {isOpen && matches.length > 0 ? (
              <div
                role="listbox"
                className="absolute left-0 right-0 mt-2 rounded-2xl border border-[rgba(237,232,224,0.12)] bg-bg-elevated/95 backdrop-blur shadow-[0_24px_60px_rgba(0,0,0,0.60)] overflow-hidden"
              >
                {matches.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    onClick={() => {
                      // TODO: [server] Replace with deep link to listing/catalog detail page.
                      router.push(`/marketplace?code=${encodeURIComponent(entry.code)}`);
                      setIsOpen(false);
                      setQuery(entry.code);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-hover transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-bg-page shrink-0 border border-[rgba(237,232,224,0.08)]">
                      <Image
                        src={entry.image}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[13px] font-semibold text-text-primary truncate">
                        {entry.name}
                      </p>
                      <p className="font-mono text-[12px] text-text-secondary">
                        {entry.code}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] border border-[rgba(212,165,116,0.22)]">
                      {entry.rarity}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {QUICK_FILTERS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setQuery(chip.query);
                  setIsOpen(true);
                  inputRef.current?.focus();
                }}
                className="shrink-0 h-9 px-3 rounded-full border border-[rgba(237,232,224,0.10)] bg-bg-page/45 text-text-primary hover:bg-bg-page/65 transition-colors font-sans text-[13px] font-medium"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

