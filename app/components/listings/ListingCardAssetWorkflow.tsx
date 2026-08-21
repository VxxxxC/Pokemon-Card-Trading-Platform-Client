/**
 * Unified card listing asset workflow — create (AddAssetModal) + edit (ListingEditDialog).
 * Shared photo-slot SSOT lives in lib/listings/card-listing-photo-slots.ts.
 *
 * TODO(partner-backlog): Extract shared grading + use_authentication toggle logic
 * into one global component consumed by AddAssetModal and ListingEditDialog
 * (see docs/dev/partner-regression.md §10 Component 前置).
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
