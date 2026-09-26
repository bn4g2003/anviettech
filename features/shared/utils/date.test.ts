import { describe, expect, it } from "vitest";
import { isDateInRange } from "./date";

describe("isDateInRange", () => {
  it("returns true when both fromDate and toDate are empty/falsy", () => {
    expect(isDateInRange("2026-09-15T10:00:00Z", "", "")).toBe(true);
    expect(isDateInRange("2026-09-15", undefined, undefined)).toBe(true);
  });

  it("returns false when date is missing but range is specified", () => {
    expect(isDateInRange(null, "2026-09-01", "2026-09-30")).toBe(false);
    expect(isDateInRange(undefined, "2026-09-01", "")).toBe(false);
  });

  it("filters correctly by fromDate only", () => {
    expect(isDateInRange("2026-09-15T12:00:00Z", "2026-09-10", "")).toBe(true);
    expect(isDateInRange("2026-09-10", "2026-09-10", "")).toBe(true);
    expect(isDateInRange("2026-09-09", "2026-09-10", "")).toBe(false);
  });

  it("filters correctly by toDate only", () => {
    expect(isDateInRange("2026-09-15T12:00:00Z", "", "2026-09-20")).toBe(true);
    expect(isDateInRange("2026-09-20", "", "2026-09-20")).toBe(true);
    expect(isDateInRange("2026-09-21", "", "2026-09-20")).toBe(false);
  });

  it("filters correctly within both bounds", () => {
    expect(isDateInRange("2026-09-15T12:00:00Z", "2026-09-10", "2026-09-20")).toBe(true);
    expect(isDateInRange("2026-09-09T23:59:59Z", "2026-09-10", "2026-09-20")).toBe(false);
    expect(isDateInRange("2026-09-21T00:00:00Z", "2026-09-10", "2026-09-20")).toBe(false);
  });
});
