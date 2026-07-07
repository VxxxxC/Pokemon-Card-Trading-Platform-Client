import { getHomeMemberListings } from "@/app/actions/home";
import { NewArrivals } from "@/app/components/home/NewArrivals";

type HomeC2cSectionDataProps = {
  currentUserId: string | null;
  favoredKeys?: string[];
};

export async function HomeC2cSectionData({
  currentUserId,
  favoredKeys = [],
}: HomeC2cSectionDataProps) {
  const result = await getHomeMemberListings();

  return (
    <NewArrivals
      listings={result.success ? result.data : []}
      currentUserId={currentUserId}
      favoredKeys={favoredKeys}
    />
  );
}
