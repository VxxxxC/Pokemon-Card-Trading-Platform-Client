import Link from "next/link";
import { CardItem, type CardData } from "@/app/components/cards/CardItem";

// TODO: [database] Replace with Supabase query — newest C2C listings ordered by created_at DESC.
// TODO: [server] Ensure buy-now locks listing status to prevent double payment (`escrow_locked`).
const NEW_ARRIVALS: CardData[] = [
  {
    id: "c2c-sv2a-172",
    name: "ピカチュウ AR（現貨）",
    set: "151",
    rarity: "AR",
    grade: { authority: "RAW", score: "NM" },
    price: 38500,
    delta: 300,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/c2c-1/840/560",
    seller: "玩家：Kaito",
  },
  {
    id: "c2c-sv2a-182",
    name: "リザードン ex SAR（現貨）",
    set: "151",
    rarity: "SAR",
    grade: { authority: "RAW", score: "NM" },
    price: 280000,
    delta: 2400,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/c2c-2/840/560",
    seller: "玩家：Mika",
  },
  {
    id: "c2c-sv3-199",
    name: "サーナイト ex SAR（現貨）",
    set: "SV3",
    rarity: "SAR",
    grade: { authority: "RAW", score: "NM" },
    price: 22000,
    delta: 500,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/c2c-3/840/560",
    seller: "玩家：Ren",
  },
  {
    id: "c2c-sv4-213",
    name: "イーブイ UR（現貨）",
    set: "SV4",
    rarity: "UR",
    grade: { authority: "RAW", score: "NM" },
    price: 68000,
    delta: 800,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/c2c-4/840/560",
    seller: "玩家：Yuna",
  },
];

export function NewArrivals() {
  return (
    <section className="mt-10" aria-labelledby="arrivals-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="arrivals-heading"
            className="font-sans text-[18px] sm:text-[20px] font-semibold text-text-primary"
          >
            最新 C2C 現貨上架
          </h2>
          <p className="mt-1 font-sans text-[13px] text-text-secondary">
            直接購買為主按鈕；即時出價為次要入口（示意）。
          </p>
        </div>
        <Link
          href="/marketplace"
          className="shrink-0 font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看更多 →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {NEW_ARRIVALS.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}

