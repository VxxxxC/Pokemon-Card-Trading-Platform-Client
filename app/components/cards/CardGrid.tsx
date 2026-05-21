import { CardItem, type CardData } from "./CardItem";

const featuredCards: CardData[] = [
  {
    id: "sv2a-182",
    name: "Charizard ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 45000,
    delta: 2400,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-charizard/400/280",
    seller: "渡邊道館",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    price: 52000,
    delta: 1000,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-mewtwo/400/280",
    seller: "京都卡牌專門店",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 38000,
    delta: 1500,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon/400/280",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-215",
    name: "Pikachu",
    set: "151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    price: 8500,
    delta: 300,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-pikachu/400/280",
    seller: "東京TCG市場",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "9" },
    price: 28000,
    delta: 3200,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-mimikyu/400/280",
    seller: "名古屋交易商",
  },
  {
    id: "sv2a-213",
    name: "Eevee",
    set: "151",
    rarity: "AR",
    grade: { authority: "RAW", score: "NM" },
    price: 6200,
    delta: 800,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-eevee/400/280",
    seller: "福岡卡牌店",
  },
];

export function CardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {featuredCards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
