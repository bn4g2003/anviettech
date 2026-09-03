import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("RecordDetailPage permission-aware loading", () => {
  it("only enables related CRM hooks when the signed-in user can view their module", () => {
    const source = readFileSync(new URL("./record-detail-page.tsx", import.meta.url), "utf8");
    expect(source).toContain('useDeals({ enabled: canLoad("deals") })');
    expect(source).toContain('useTasks({ enabled: canLoad("tasks") })');
    expect(source).toContain('useQuotes({ enabled: canLoad("quotes") })');
    expect(source).toContain('useContracts({ enabled: canLoad("contracts") })');
  });
});
