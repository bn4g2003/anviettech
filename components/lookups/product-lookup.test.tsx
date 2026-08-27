import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/products/hooks/use-products", () => ({
  useProducts: () => ({
    all: [
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
});
