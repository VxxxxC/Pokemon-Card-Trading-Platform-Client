import Image from "next/image";

// TODO: [database] Replace with Supabase Realtime stream — subscribe to `transactions` table INSERT events
// TODO: [server] Relative timestamps (e.g. "2分鐘前") must be computed from real `created_at` field using date-fns or Intl.RelativeTimeFormat
const transactions = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    price: 44800,
    delta: 2400,
    deltaDir: "up" as const,
    grade: "PSA 10",
    time: "2分鐘前",
    image: "https://picsum.photos/seed/tx-zard/100/140",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    price: 51000,
    delta: 1000,
    deltaDir: "down" as const,
    grade: "BGS 9.5",
    time: "8分鐘前",
    image: "https://picsum.photos/seed/tx-mewtwo/100/140",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    price: 39500,
    delta: 1500,
    deltaDir: "up" as const,
    grade: "PSA 10",
    time: "15分鐘前",
    image: "https://picsum.photos/seed/tx-umbreon/100/140",
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    price: 8200,
    delta: 300,
    deltaDir: "down" as const,
    grade: "CGC 9",
    time: "23分鐘前",
    image: "https://picsum.photos/seed/tx-pika/100/140",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    price: 28500,
    delta: 3200,
    deltaDir: "up" as const,
    grade: "PSA 9",
    time: "31分鐘前",
    image: "https://picsum.photos/seed/tx-mimi/100/140",
  },
  {
    id: "sv2a-213",
    name: "Eevee AR",
    price: 6500,
    delta: 800,
    deltaDir: "up" as const,
    grade: "RAW NM",
    time: "45分鐘前",
    image: "https://picsum.photos/seed/tx-eevee/100/140",
  },
  {
    id: "sv3-199",
    name: "Gardevoir ex SAR",
    price: 21500,
    delta: 500,
    deltaDir: "down" as const,
    grade: "BGS 9",
    time: "1小時前",
    image: "https://picsum.photos/seed/tx-gard/100/140",
  },
  {
    id: "sv2a-197",
    name: "Lucario ex SAR",
    price: 18800,
    delta: 700,
    deltaDir: "up" as const,
    grade: "PSA 10",
    time: "1小時前",
    image: "https://picsum.photos/seed/tx-luca/100/140",
  },
];

export function TransactionWall() {
  return (
    <div className="bg-bg-card rounded-[16px] border border-[rgba(237,232,224,0.08)] shadow-[0_1px_4px_rgba(0,0,0,0.30)] overflow-hidden">
      {transactions.map((tx, i) => (
        <div
          key={`${tx.id}-${i}`}
          className={`flex items-center justify-between px-4 py-3 md:p-4 md:h-20 hover:bg-bg-elevated transition-colors ${
            i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""
          }`}
        >
          {/* Card thumbnail + name + metadata */}
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
            <div className="relative w-10 h-14 md:w-12 md:h-16 shrink-0 rounded-[4px] overflow-hidden border border-[rgba(237,232,224,0.12)] bg-bg-elevated">
              <Image
                src={tx.image}
                alt={tx.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 40px, 48px"
              />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-[13px] md:text-[15px] font-bold text-text-primary truncate">
                {tx.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[11px] text-text-secondary">
                  {tx.id}
                </span>
                <span className="text-text-secondary" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono text-[11px] text-text-secondary">
                  {tx.grade}
                </span>
              </div>
            </div>
          </div>

          {/* Price + delta */}
          <div className="text-right shrink-0">
            <p className="font-mono font-black text-[14px] md:text-[16px] text-text-primary">
              ¥{tx.price.toLocaleString("zh-TW")}
            </p>
            <span
              className={`font-mono text-[11px] font-bold ${
                tx.deltaDir === "up" ? "text-success" : "text-warning"
              }`}
            >
              {tx.deltaDir === "up" ? "▲" : "▼"} ¥
              {tx.delta.toLocaleString("zh-TW")}
            </span>
          </div>

          {/* Timestamp */}
          <div className="text-right shrink-0 ml-3 w-[52px] md:w-[60px]">
            <p className="font-mono text-[11px] text-text-secondary">
              {tx.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
