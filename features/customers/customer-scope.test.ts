import { describe, expect, it } from "vitest";
import { scopeForCustomerView } from "./customer-scope";

describe("scopeForCustomerView", () => {
  it("limits the My Customers shortcut to the signed-in owner's records", () => {
    expect(scopeForCustomerView("mine")).toBe("my");
    expect(scopeForCustomerView("all")).toBeUndefined();
  });
});
