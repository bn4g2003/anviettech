import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/customers/hooks/use-customers", () => ({
  useCustomers: () => ({
    all: [{ id: "customer-1", code: "KH-001", name: "Khách hàng mẫu" }],
  }),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, ...props }: ComponentProps<"select">) => (
    <select {...props}>{children}</select>
  ),
}));

import { CustomerLookup } from "./customer-lookup";

describe("CustomerLookup", () => {
  it("shows the required placeholder when no customer has been selected", () => {
    const markup = renderToStaticMarkup(
      <CustomerLookup allowEmpty={false} value="" onChange={vi.fn()} />,
    );

    expect(markup).toMatch(
      /<option value="" disabled="" selected="">Chọn khách hàng<\/option>/,
    );
  });
});
