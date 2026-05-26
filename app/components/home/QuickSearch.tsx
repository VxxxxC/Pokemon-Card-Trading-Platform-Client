"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#50453b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function QuickSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/marketplace");
    }
  };

  return (
    <section className="mb-8" aria-label="快速搜尋">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋卡牌名稱、序號或系列（例：Charizard ex · sv2a-182）"
          className="w-full h-12 pl-12 pr-28 bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-[10px] font-sans text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.30)] transition-shadow"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-brand text-[#17130f] font-sans font-medium text-[13px] rounded-[6px] active:scale-[0.98] transition-transform hover:bg-brand-hover min-h-[36px]"
        >
          搜尋
        </button>
      </form>
    </section>
  );
}
