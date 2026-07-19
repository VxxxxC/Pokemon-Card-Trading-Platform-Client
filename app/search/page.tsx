import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "市場 · Marketplace",
  description:
    "Browse premium Japanese Pokémon cards — SAR, UR, AR, and sealed product.",
};

export default function SearchPage() {
  redirect("/marketplace");
}
