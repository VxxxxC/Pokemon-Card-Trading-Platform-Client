import { NextResponse } from "next/server";

// TODO [API]: In production, replace pokemontcg.io with internal Supabase DB + Apify-scraped Mercari JP data
// This endpoint serves as a development proxy to https://api.pokemontcg.io/v2/cards

const POKEMON_TCG_API = "https://api.pokemontcg.io/v2/cards";

export type PokemonCard = {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  set: {
    id: string;
    name: string;
    series: string;
  };
  rarity?: string;
  images: {
    small: string;
    large: string;
  };
  cardmarket?: {
    prices?: {
      averageSellPrice?: number;
      trendPrice?: number;
    };
  };
  tcgplayer?: {
    prices?: Record<
      string,
      {
        market?: number;
        mid?: number;
        low?: number;
        high?: number;
      }
    >;
  };
};

type PokemonTCGResponse = {
  data: PokemonCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "20";
  const orderBy = searchParams.get("orderBy") || "";

  // Build the pokemontcg.io query params
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  params.set("page", page);
  params.set("pageSize", pageSize);
  if (orderBy) {
    params.set("orderBy", orderBy);
  }

  try {
    const res = await fetch(`${POKEMON_TCG_API}?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour during development
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Pokemon TCG API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data: PokemonTCGResponse = await res.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch Pokemon card data" },
      { status: 500 }
    );
  }
}
