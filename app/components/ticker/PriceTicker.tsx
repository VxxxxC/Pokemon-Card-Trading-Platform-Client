"use client";

const tickers = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    price: 45000,
    delta: 2400,
    direction: "up" as const,
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    price: 52000,
    delta: 1000,
    direction: "down" as const,
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    price: 38000,
    delta: 1500,
    direction: "up" as const,
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    price: 8500,
    delta: 300,
    direction: "down" as const,
  },
  {
    id: "sv2a-213",
    name: "Eevee AR",
    price: 6200,
    delta: 800,
    direction: "up" as const,
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    price: 28000,
    delta: 3200,
    direction: "up" as const,
  },
  {
    id: "sv3-199",
    name: "Gardevoir ex SAR",
    price: 22000,
    delta: 500,
    direction: "down" as const,
  },
  {
    id: "sv2a-197",
    name: "Lucario ex SAR",
    price: 18500,
    delta: 700,
    direction: "up" as const,
  },
];

export function PriceTicker() {
  // Duplicate items for seamless infinite scroll
  const items = [...tickers, ...tickers];

  return (
    <div
      className="w-full bg-bg-shell overflow-hidden h-9 flex items-center shrink-0 border-b border-[rgba(237,232,224,0.08)]"
      aria-label="即時價格走勢"
      aria-live="off"
    >
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-6 font-mono text-[12px] shrink-0"
          >
            <span className="text-text-disabled">{item.id}</span>
            <span className="text-text-primary font-medium">{item.name}</span>
            <span className="text-text-primary font-medium">
              ¥{item.price.toLocaleString("zh-TW")}
            </span>
            <span
              className={
                item.direction === "up" ? "text-success" : "text-warning"
              }
            >
              {item.direction === "up" ? "▲" : "▼"} ¥
              {item.delta.toLocaleString("zh-TW")}
            </span>
            <span className="text-text-disabled ml-1" aria-hidden="true">
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
