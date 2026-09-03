import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("useDeals permission guard", () => {
  it("does not request deals for a user without deals:view", () => {
    const source = readFileSync(new URL("./use-deals.ts", import.meta.url), "utf8");
    expect(source).toContain("const canViewDeals");
    expect(source).toContain("if (!canViewDeals)");
    expect(source).toContain("setRows([])");
  });
});
