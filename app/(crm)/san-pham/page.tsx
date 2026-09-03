"use client";

import { ListPageProvider } from "@/features/shared/hooks/use-list-page";
import { ProductsPageHeader } from "./_components/products-page-header";
import { ProductsFilterBar } from "./_components/products-filter-bar";
import { ProductsTable } from "./_components/products-table";
import { ProductFormDialog } from "./_components/product-form-dialog";
import { ProductDetailDrawer } from "./_components/product-detail-drawer";
import { ProductDeleteDialog } from "./_components/product-delete-dialog";

const COLUMNS = [
  "sku",
  "name",
  "category",
  "itemType",
  "unit",
  "price",
  "vat",
  "stock",
  "status",
  "actions",
];

export default function ProductsPage() {
  return (
    <ListPageProvider defaultColumns={COLUMNS}>
      <div className="flex h-full min-h-0 flex-col">
        <ProductsPageHeader />
        <ProductsFilterBar />
        <ProductsTable />
        <ProductFormDialog />
        <ProductDetailDrawer />
        <ProductDeleteDialog />
      </div>
    </ListPageProvider>
  );
}
