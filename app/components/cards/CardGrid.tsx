import { CardItem, type CardData } from "./CardItem";
import {
  fetchPokemonCards,
  toCardData,
  FALLBACK_CARDS,
} from "@/app/lib/pokemon-data";

// TODO [server]: Replace with Supabase query — fetch top-rated/featured listings from `listings` table ordered by price or view count

export async function CardGrid() {
  let cards: CardData[];

  try {
    const apiCards = await fetchPokemonCards({
      q: "supertype:pokémon rarity:illustration",
      pageSize: 10,
    });
    cards = apiCards.length > 0 ? apiCards.map(toCardData) : FALLBACK_CARDS;
  } catch {
    cards = FALLBACK_CARDS;
  }

  return (
    <>
      {/* Mobile: horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide sm:hidden">
        {cards.map((card) => (
          <div key={card.id} className="shrink-0 w-[200px]">
            <CardItem card={card} compact />
          </div>
        ))}
      </div>

      {/* Desktop: 3-5 column grid */}
      <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <CardItem key={card.id} card={card} compact />
        ))}
      </div>
    </>
  );
}
