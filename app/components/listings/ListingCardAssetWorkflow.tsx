/**
 * Unified card listing asset workflow — create (AddAssetModal) + edit (ListingEditDialog).
 * Shared photo-slot SSOT lives in lib/listings/card-listing-photo-slots.ts.
 */
export {
  AddAssetModal,
  triggerGlobalAddAssetModal,
} from "@/app/components/shared/AddAssetModal";
export { ListingEditDialog } from "@/app/components/merchant/ListingEditDialog";
export {
  buildEditListingPhotoSlots,
  createEmptyCreatePhotoSlots,
  type CreateListingPhotoSlot,
  type EditListingPhotoSlot,
} from "@/lib/listings/card-listing-photo-slots";
