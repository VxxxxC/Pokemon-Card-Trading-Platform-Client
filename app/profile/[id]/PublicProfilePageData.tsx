import { notFound } from "next/navigation";
import { getPublicProfilePageBootstrap } from "@/app/actions/profile";
import type { ReviewPersona } from "@/app/lib/reviews/types";
import { PublicProfileClient } from "./PublicProfileClient";

interface PublicProfilePageDataProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ persona?: string }>;
}

function parsePersona(value: string | undefined): ReviewPersona | undefined {
  if (value === "merchant") {
    return "merchant";
  }
  if (value === "member") {
    return "member";
  }
  return undefined;
}

export async function PublicProfilePageData({
  params,
  searchParams,
}: PublicProfilePageDataProps) {
  const { id } = await params;
  const { persona: personaParam } = await searchParams;
  const persona = parsePersona(personaParam);

  const result = await getPublicProfilePageBootstrap(id, { persona });

  if (!result.success) {
    if (result.notFound) {
      notFound();
    }

    return (
      <PublicProfileClient initialData={null} bootstrapError={result.error} />
    );
  }

  return <PublicProfileClient initialData={result.data} />;
}
