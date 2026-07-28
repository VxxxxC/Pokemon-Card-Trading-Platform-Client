"use client";

import { ListingFormModal } from "@/app/components/shared/ListingFormModal";
import type { CardInstance, SKUGroup } from "@/app/components/merchant/InventoryAccordion";

type ListingEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku: Pick<SKUGroup, "cardName" | "cardNo">;
  item: CardInstance;
  onSaved?: () => void;
};

export function ListingEditDialog({
  open,
  onOpenChange,
  sku,
  item,
  onSaved,
}: ListingEditDialogProps) {
  return (
    <ListingFormModal
      mode="edit"
      isOpen={open}
      onClose={() => onOpenChange(false)}
      sku={sku}
      item={item}
      onSaved={onSaved}
    />
  );
}
