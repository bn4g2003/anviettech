import { describe, expect, it } from "vitest";
import { filterSearchableOptions } from "./searchable-select";

const options = [
  { id: "customer-1", label: "KH-001 — Công ty Thiên Phúc", searchText: "KH-001 Công ty Thiên Phúc" },
  { id: "customer-2", label: "KH-002 — Anh Trần Văn An", searchText: "KH-002 Anh Trần Văn An" },
];

describe("filterSearchableOptions", () => {
  it("finds an option by its code", () => {
    expect(filterSearchableOptions(options, "kh-002").map((option) => option.id)).toEqual(["customer-2"]);
  });

  it("finds Vietnamese names without requiring accents", () => {
    expect(filterSearchableOptions(options, "thien phuc").map((option) => option.id)).toEqual(["customer-1"]);
  });

  it("keeps every option when the search is blank", () => {
    expect(filterSearchableOptions(options, "  ")).toEqual(options);
  });
});
