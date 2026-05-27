"use client";

// TODO: [server] Do not connect public visitors directly to Supabase Realtime.
// TODO: [server] Implement Edge Function cache refresh every 30–60s; frontend polls quietly.
// TODO: [database] Add a lightweight cached table/view for latest completed trades (e.g. `trade_feed_cache`).
const pulses = [
  { id: "pulse-1", user: "玩家***", verb: "剛剛以", price: 45000, action: "成功截胡", card: "リザードン ex SAR" },
  { id: "pulse-2", user: "玩家***", verb: "剛剛以", price: 38500, action: "入手", card: "ピカチュウ AR" },
  { id: "pulse-3", user: "玩家***", verb: "剛剛以", price: 145000, action: "完成託管成交", card: "ミュウツー ex SAR" },
  { id: "pulse-4", user: "玩家***", verb: "剛剛以", price: 188000, action: "完成鑑定放行", card: "コライドン ex SAR" },
  { id: "pulse-5", user: "玩家***", verb: "剛剛以", price: 410000, action: "鎖定現貨", card: "ブラッキー ex SAR" },
  { id: "pulse-6", user: "玩家***", verb: "剛剛以", price: 68000, action: "狙擊成功", card: "イーブイ UR" },
];

export function PriceTicker() {
  // Duplicate items for seamless infinite scroll
  const items = [...pulses, ...pulses];

  return (
    <div
      className="w-full bg-bg-shell overflow-hidden h-9 flex items-center shrink-0 border-b border-[rgba(237,232,224,0.08)]"
      aria-label="市場脈動走馬燈"
      aria-live="off"
    >
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="inline-flex items-center gap-2 px-6 font-mono text-[12px] shrink-0"
          >
            <span className="text-text-disabled">{item.user}</span>
            <span className="text-text-secondary">{item.verb}</span>
            <span className="text-text-primary font-medium">
              ¥{item.price.toLocaleString("ja-JP")}
            </span>
            <span className="text-text-secondary">{item.action}</span>
            <span className="text-text-primary font-medium">{item.card}</span>
            <span className="text-text-disabled ml-1" aria-hidden="true">
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
