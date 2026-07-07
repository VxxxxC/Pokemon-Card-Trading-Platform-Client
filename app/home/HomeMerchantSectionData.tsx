import { getHomeMerchantListings } from "@/app/actions/home";
import { PremiumMarket } from "@/app/components/home/PremiumMarket";

type HomeMerchantSectionDataProps = {
  currentUserId: string | null;
  favoredKeys?: string[];
};

export async function HomeMerchantSectionData({
  currentUserId,
  favoredKeys = [],
}: HomeMerchantSectionDataProps) {
  const result = await getHomeMerchantListings();

  return (
    <PremiumMarket
      listings={result.success ? result.data : []}
      currentUserId={currentUserId}
      favoredKeys={favoredKeys}
    />
  );
}
