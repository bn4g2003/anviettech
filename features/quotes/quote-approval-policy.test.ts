import { describe, expect, it } from "vitest";

import { canApproveQuoteByRole } from "./quote-approval-policy";

describe("canApproveQuoteByRole", () => {
  it("allows only administrative and sales-manager roles", () => {
    expect(canApproveQuoteByRole(["Super admin"])).toBe(true);
    expect(canApproveQuoteByRole(["Admin"])).toBe(true);
    expect(canApproveQuoteByRole(["Trưởng kinh doanh"])).toBe(true);
  });

  it("denies approval even when another role has an approve permission", () => {
    expect(canApproveQuoteByRole(["Kế toán"])).toBe(false);
    expect(canApproveQuoteByRole(["Nhân viên kinh doanh"])).toBe(false);
  });
});
