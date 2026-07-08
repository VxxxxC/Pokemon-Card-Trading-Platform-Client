import { Suspense } from "react";
import { PublicProfilePageData } from "./PublicProfilePageData";

interface ProfileIdPageProps {
  params: Promise<{ id: string }>;
}

function PublicProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  );
}

export default function PublicProfilePage({ params }: ProfileIdPageProps) {
  return (
    <Suspense fallback={<PublicProfilePageSkeleton />}>
      <PublicProfilePageData params={params} />
    </Suspense>
  );
}
