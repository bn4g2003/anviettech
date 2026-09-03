import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("StockMoveFormDialog project reference", () => {
  it("loads projects without requiring the active status", () => {
    const source = readFileSync(new URL("./stock-move-form-dialog.tsx", import.meta.url), "utf8");

    expect(source).toContain("`/api/v1/projects${toQuery({ pageSize: 100 })}`");
    expect(source).not.toContain("`/api/v1/projects${toQuery({ pageSize: 100, status: \"active\" })}`");
  });
});
