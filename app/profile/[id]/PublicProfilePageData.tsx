import { notFound } from "next/navigation";
import { getPublicProfilePageBootstrap } from "@/app/actions/profile";
import { PublicProfileClient } from "./PublicProfileClient";

interface PublicProfilePageDataProps {
  params: Promise<{ id: string }>;
}

export async function PublicProfilePageData({
  params,
}: PublicProfilePageDataProps) {
  const { id } = await params;
  const result = await getPublicProfilePageBootstrap(id);

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
