"use client";

// TODO [MOCK DATA]: Replace with Supabase Edge Function polling — fetch latest 20 completed transactions from Redis/memory cache every 30-60s
// Spec: Market Pulse Ticker — show transaction-style FOMO messages, NOT raw price feed
const recentTransactions = [
  { buyer: "玩家K***", price: "¥45,000", card: "Charizard ex SAR" },
  { buyer: "收藏家M***", price: "¥52,000", card: "Mewtwo ex SAR" },
  { buyer: "投資者T***", price: "¥38,000", card: "Umbreon ex SAR" },
  { buyer: "玩家A***", price: "¥8,500", card: "Pikachu AR" },
  { buyer: "道館主S***", price: "¥28,000", card: "Mimikyu ex SAR" },
  { buyer: "收藏家R***", price: "¥6,200", card: "Eevee AR" },
  { buyer: "玩家H***", price: "¥22,000", card: "Gardevoir ex SAR" },
  { buyer: "投資者N***", price: "¥18,500", card: "Lucario ex SAR" },
];

export function PriceTicker() {
  const items = [...recentTransactions, ...recentTransactions];

  return (
    <div
      className="w-full bg-bg-shell overflow-hidden h-9 flex items-center shrink-0 border-b border-[rgba(237,232,224,0.08)]"
      aria-label="實時成交走馬燈"
      aria-live="off"
    >
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-6 font-sans text-[12px] shrink-0"
          >
            <span className="text-success">🔥</span>
            <span className="text-text-secondary">{item.buyer}</span>
            <span className="text-text-primary">剛剛以</span>
            <span className="font-mono font-medium text-brand">{item.price}</span>
            <span className="text-text-primary">成功截胡</span>
            <span className="font-medium text-text-primary">{item.card}</span>
            <span className="text-text-disabled ml-2" aria-hidden="true">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
