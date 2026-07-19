import Image from "next/image";
import Link from "next/link";
import { RarityBadge } from "./RarityBadge";
import { GradeBadge } from "./GradeBadge";
import { WishlistButton } from "@/app/components/market/WishlistButton";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";

export type CardData = {
  id: string;
  productId?: string;
  sellerId?: string;
  name: string;
  set: string;
  rarity: "SAR" | "UR" | "SR" | "AR";
  grade: { authority: string; score: string };
  gradingCompany?: string;
  gradingScore?: string;
  price: number;
  delta: number;
  deltaDirection: "up" | "down";
  image: string;
  seller: string;
};

export function CardItem({ card }: { card: CardData }) {
  const formattedPrice = `¥${card.price.toLocaleString("zh-TW")}`;
  const formattedDelta = `${card.deltaDirection === "up" ? "▲" : "▼"} ¥${card.delta.toLocaleString("zh-TW")}`;

  // Convert CardData to MarketplaceListing for BuyButton compatibility
  const listing = {
    ...card,
    productId: card.productId ?? card.id,
    sellerId: card.sellerId,
    rarity: card.rarity as "SAR" | "UR" | "SR" | "AR",
    gradingCompany: card.grade.authority,
    gradingScore: card.grade.score,
  };

  return (
    <article className="group bg-bg-card rounded-[16px] border border-[rgba(237,232,224,0.08)] shadow-[0_1px_4px_rgba(0,0,0,0.30)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.50)] transition-shadow duration-200 overflow-hidden">
      {/* Card Image */}
      <Link
        href={`/listing/${card.id}`}
        className="block relative w-full aspect-[5/3.5] overflow-hidden bg-bg-elevated"
      >
        <Image
          src={card.image}
          alt={`${card.name} — ${card.rarity}`}
          fill
          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 right-3">
          <RarityBadge rarity={card.rarity} />
        </div>
        {/* Wishlist star — absolute top-left */}
        <div className="absolute top-3 left-3">
          <WishlistButton
            productId={card.productId ?? card.id}
            gradingCompany={card.gradingCompany ?? card.grade.authority}
            gradingScore={card.gradingScore ?? card.grade.score}
            trackedPrice={card.price > 0 ? card.price : null}
          />
        </div>
      </Link>

      {/* Card Details */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h3 className="font-sans font-semibold text-[16px] text-text-primary leading-tight truncate">
              {card.name}
            </h3>
            <span className="font-mono text-[12px] text-text-secondary">
              {card.id} · {card.set}
            </span>
          </div>
          <GradeBadge
            authority={card.grade.authority}
            score={card.grade.score}
          />
        </div>

        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="font-mono font-medium text-[18px] text-text-primary">
              {formattedPrice}
            </p>
            <span
              className={`font-mono text-[12px] ${
                card.deltaDirection === "up" ? "text-success" : "text-warning"
              }`}
            >
              {formattedDelta}
            </span>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] text-text-secondary">賣家</p>
            <p className="font-sans text-[13px] text-text-primary truncate max-w-[100px]">
              {card.seller}
            </p>
          </div>
        </div>

        {/* CTAs */}
        {/* TODO: [server] "立即購買" must trigger escrow flow — create order in Supabase, initiate Stripe Connect PaymentIntent */}
        {/* TODO: [server] /listing/${card.id} route does not exist yet — create app/listing/[id]/page.tsx */}
        <div className="mt-4 w-full">
          <BuyButton
            listing={listing}
            label="⚡ 立即購買"
            className="w-full h-10"
          />
        </div>
      </div>
    </article>
  );
}
