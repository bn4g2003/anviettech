import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/products/hooks/use-products", () => ({
  useProducts: () => ({
    all: [
      { id: "goods-1", sku: "GOODS-001", name: "Goods product", status: "active", itemType: "goods" },
      { id: "service-1", sku: "SERVICE-001", name: "Service product", status: "active", itemType: "service" },
      { id: "product-1", sku: "SP-001", name: "Sản phẩm mẫu", status: "active" },
    ],
  }),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, ...props }: ComponentProps<"select">) => (
    <select {...props}>{children}</select>
  ),
}));

import { ProductLookup } from "./product-lookup";

describe("ProductLookup", () => {
  it("shows the required placeholder when no product has been selected", () => {
    const markup = renderToStaticMarkup(
      <ProductLookup allowEmpty={false} value="" onChange={vi.fn()} />,
    );

    expect(markup).toMatch(
      /<option value="" disabled="" selected="">Chọn sản phẩm<\/option>/,
    );
  });

  it("can limit warehouse lookups to physical goods", () => {
    const markup = renderToStaticMarkup(
      <ProductLookup itemType="goods" value="" onChange={vi.fn()} />,
    );

    expect(markup).toContain("GOODS-001");
    expect(markup).not.toContain("SERVICE-001");
  });
});
