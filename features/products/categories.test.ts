import { describe, expect, it } from "vitest";
import { DEFAULT_PRODUCT_CATEGORIES } from "./constants";

describe("Product categories", () => {
  it("includes the 4 required business categories and service", () => {
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Thiết bị điện chính");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Thiết bị lưu trữ");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Vật tư");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Phụ kiện");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Dịch vụ");
  });

  it("has unique category names", () => {
    const unique = new Set(DEFAULT_PRODUCT_CATEGORIES);
    expect(unique.size).toBe(DEFAULT_PRODUCT_CATEGORIES.length);
  });
});
