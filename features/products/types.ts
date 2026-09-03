import type { EntityId, Timestamps } from "@/features/shared/types/ids";

export type ProductStatus = "active" | "inactive";
export type ProductItemType = "goods" | "service";

export type Product = Timestamps & {
  id: EntityId;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  vatPercent: number;
  status: ProductStatus;
  itemType: ProductItemType;
  minStock: number;
  description?: string;
};

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
