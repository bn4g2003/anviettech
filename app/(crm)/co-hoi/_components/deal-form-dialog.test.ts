import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("DealFormDialog", () => {
  it("requires a reason field for won or lost stages", () => {
    const source = readFileSync(new URL("./deal-form-dialog.tsx", import.meta.url), "utf8");

    expect(source).toContain("Lý do *</span>");
    expect(source).toContain('form.stage === "won" || form.stage === "lost"');
  });
});
