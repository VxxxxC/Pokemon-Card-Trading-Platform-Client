const transactions = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    price: 44800,
    delta: 2400,
    deltaDir: "up" as const,
    grade: "PSA 10",
    time: "2分前",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    price: 51000,
    delta: 1000,
    deltaDir: "down" as const,
    grade: "BGS 9.5",
    time: "8分前",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    price: 39500,
    delta: 1500,
    deltaDir: "up" as const,
    grade: "PSA 10",
    time: "15分前",
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    price: 8200,
    delta: 300,
    deltaDir: "down" as const,
    grade: "CGC 9",
    time: "23分前",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    price: 28500,
    delta: 3200,
    deltaDir: "up" as const,
    grade: "PSA 9",
    time: "31分前",
  },
  {
    id: "sv2a-213",
    name: "Eevee AR",
    price: 6500,
    delta: 800,
    deltaDir: "up" as const,
    grade: "RAW NM",
    time: "45分前",
  },
  {
    id: "sv3-199",
    name: "Gardevoir ex SAR",
    price: 21500,
    delta: 500,
    deltaDir: "down" as const,
    grade: "BGS 9",
    time: "1時間前",
  },
  {
    id: "sv2a-197",
    name: "Lucario ex SAR",
    price: 18800,
    delta: 700,
    deltaDir: "up" as const,
    grade: "PSA 10",
    time: "1時間前",
  },
];

export function TransactionWall() {
  return (
    <div className="bg-white rounded-[16px] border border-[rgba(226,232,240,0.6)] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      {transactions.map((tx, i) => (
        <div
          key={`${tx.id}-${i}`}
          className={`flex items-center justify-between px-4 py-3 hover:bg-[#F8F9FA] transition-colors ${
            i > 0 ? "border-t border-[rgba(226,232,240,0.6)]" : ""
          }`}
        >
          {/* Card name + metadata */}
          <div className="flex-1 min-w-0 pr-3">
            <p className="font-sans text-[13px] font-medium text-[#202124] truncate">
              {tx.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[11px] text-[#5F6368]">
                {tx.id}
              </span>
              <span className="text-[#5F6368]" aria-hidden="true">
                ·
              </span>
              <span className="font-mono text-[11px] text-[#5F6368]">
                {tx.grade}
              </span>
            </div>
          </div>

          {/* Price + delta */}
          <div className="text-right shrink-0">
            <p className="font-mono font-medium text-[14px] text-[#202124]">
              ¥{tx.price.toLocaleString("ja-JP")}
            </p>
            <span
              className={`font-mono text-[11px] ${
                tx.deltaDir === "up" ? "text-[#16A34A]" : "text-[#DC2626]"
              }`}
            >
              {tx.deltaDir === "up" ? "▲" : "▼"} ¥
              {tx.delta.toLocaleString("ja-JP")}
            </span>
          </div>

          {/* Timestamp */}
          <div className="text-right shrink-0 ml-3 w-[52px]">
            <p className="font-mono text-[11px] text-[#5F6368]">{tx.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
