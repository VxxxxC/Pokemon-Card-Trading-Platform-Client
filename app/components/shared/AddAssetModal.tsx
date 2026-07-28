"use client";

import { useUIStore } from "@/app/store/useUIStore";
import { ListingFormModal } from "@/app/components/shared/ListingFormModal";

export type { GlobalAssetPayload } from "@/app/components/shared/ListingFormModal";

export function AddAssetModal() {
  const isOpen = useUIStore((state) => state.isAddAssetOpen);
  const mode = useUIStore((state) => state.addAssetMode);
  const sellPrefill = useUIStore((state) => state.addAssetSellPrefill);
  const sellerPersona = useUIStore((state) => state.addAssetSellerPersona);
  const closeAddAssetModal = useUIStore((state) => state.closeAddAssetModal);

  return (
    <ListingFormModal
      mode="create"
      isOpen={isOpen}
      onClose={closeAddAssetModal}
      initialViewMode={mode}
      sellPrefill={sellPrefill}
      sellerPersona={sellerPersona}
    />
  );
}

export const triggerGlobalAddAssetModal = (
  defaultMode: "hobby" | "merch" = "hobby",
) => {
  useUIStore.getState().openAddAssetModal({ mode: defaultMode });
};
