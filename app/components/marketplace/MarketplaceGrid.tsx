import { MarketplaceCard, type MarketplaceListing } from "./MarketplaceCard";

type MarketplaceListingSeed = Pick<MarketplaceListing, "id" | "name" | "rarity" | "price" | "image" | "seller"> & {
  badge: string;
};

// TODO: [database] Replace this array with a Supabase query on the `listings` table,
// e.g. supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(20)
const MOCK_LISTING_SEEDS: MarketplaceListingSeed[] = [
  {
    id: "sv2a-182-sar-001",
    name: "リザードン ex SAR",
    rarity: "SAR",
    price: 280000,
    image: "https://picsum.photos/seed/charizard/400/560",
    badge: "🔥 Hot",
    seller: "レン精選",
  },
  {
    id: "sv2a-172-ar-001",
    name: "ピカチュウ AR",
    rarity: "AR",
    price: 38500,
    image: "https://picsum.photos/seed/pikachu/400/560",
    badge: "📈 +18%",
    seller: "KiraCards",
  },
  {
    id: "sv3-197-sar-001",
    name: "ミュウツー ex SAR",
    rarity: "SAR",
    price: 145000,
    image: "https://picsum.photos/seed/mewtwo/400/560",
    badge: "⚡ Rare",
    seller: "Akiba市場",
  },
  {
    id: "sv1-003-sar-001",
    name: "フシギバナ ex SAR",
    rarity: "SAR",
    price: 92000,
    image: "https://picsum.photos/seed/bulbasaur/400/560",
    badge: "🏆 Top",
    seller: "レン精選",
  },
  {
    id: "sv2b-054-ar-001",
    name: "ゲンガー AR",
    rarity: "AR",
    price: 28800,
    image: "https://picsum.photos/seed/gengar/400/560",
    badge: "🔥 Hot",
    seller: "NightTrade",
  },
  {
    id: "sv4-213-ur-001",
    name: "イーブイ UR",
    rarity: "UR",
    price: 68000,
    image: "https://picsum.photos/seed/eevee/400/560",
    badge: "📈 +12%",
    seller: "EvoShop",
  },
  {
    id: "sv3-245-sar-001",
    name: "カイリュー ex SAR",
    rarity: "SAR",
    price: 118000,
    image: "https://picsum.photos/seed/dragonite/400/560",
    badge: "⚡ Rare",
    seller: "DragoCo",
  },
  {
    id: "sv2a-099-sr-001",
    name: "ルカリオ SR",
    rarity: "SR",
    price: 18500,
    image: "https://picsum.photos/seed/lucario/400/560",
    badge: "🏆 Top",
    seller: "KiraCards",
  },
  {
    id: "sv5-178-ar-001",
    name: "ガルーラ AR",
    rarity: "AR",
    price: 22000,
    image: "https://picsum.photos/seed/kangaskhan/400/560",
    badge: "🔥 Hot",
    seller: "Akiba市場",
  },
  {
    id: "sv4-302-sar-001",
    name: "ミライドン ex SAR",
    rarity: "SAR",
    price: 195000,
    image: "https://picsum.photos/seed/miraidon/400/560",
    badge: "📈 +22%",
    seller: "FutureCards",
  },
  {
    id: "sv4-301-sar-001",
    name: "コライドン ex SAR",
    rarity: "SAR",
    price: 188000,
    image: "https://picsum.photos/seed/koraidon/400/560",
    badge: "📈 +19%",
    seller: "FutureCards",
  },
  {
    id: "sv2a-184-ur-001",
    name: "リザードン UR",
    rarity: "UR",
    price: 320000,
    image: "https://picsum.photos/seed/charizard2/400/560",
    badge: "🔥 Hot",
    seller: "レン精選",
  },
  {
    id: "sv1-052-ar-001",
    name: "ニャオハ AR",
    rarity: "AR",
    price: 8500,
    image: "https://picsum.photos/seed/sprigatito/400/560",
    badge: "⚡ Rare",
    seller: "NewGen",
  },
  {
    id: "sv3-199-sr-001",
    name: "ミュウ SR",
    rarity: "SR",
    price: 42000,
    image: "https://picsum.photos/seed/mew/400/560",
    badge: "🏆 Top",
    seller: "MythicTrade",
  },
];

const MOCK_LISTINGS: MarketplaceListing[] = MOCK_LISTING_SEEDS.map((seed) => {
  const isUpTrend =
    seed.badge.includes("📈") || seed.badge.includes("🔥") || seed.badge.includes("🏆");

  return {
    id: seed.id,
    name: seed.name,
    set: seed.id.split("-").slice(0, 2).join("-").toUpperCase(),
    rarity: seed.rarity,
    grade: {
      authority: "PSA",
      score: seed.rarity === "SAR" || seed.rarity === "UR" ? "10" : "9",
    },
    gradingCompany: "PSA",
    gradingScore: seed.rarity === "SAR" || seed.rarity === "UR" ? "10" : "9",
    price: seed.price,
    delta: Math.max(500, Math.round(seed.price * (isUpTrend ? 0.05 : 0.03))),
    deltaDirection: isUpTrend ? "up" : "down",
    image: seed.image,
    seller: seed.seller,
  };
});

export function MarketplaceGrid() {
  return (
    <div className="px-4 py-4">
      {/* Result count */}
      <p className="font-mono text-[11px] text-[#8c7355] mb-3">
        {MOCK_LISTINGS.length} 件出品中
      </p>

      {/* 2-col mobile, 4-col desktop grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_LISTINGS.map((listing) => (
          <MarketplaceCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
