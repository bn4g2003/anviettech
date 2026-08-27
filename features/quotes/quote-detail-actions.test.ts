import { describe, expect, it } from "vitest";

import { getQuoteDetailAction } from "./quote-detail-actions";

describe("getQuoteDetailAction", () => {
  it("only allows approval for a sent quote when the user has approval permission", () => {
    expect(getQuoteDetailAction("sent", true, false)).toBe("approve");
    expect(getQuoteDetailAction("sent", false, true)).toBeNull();
    expect(getQuoteDetailAction("draft", true, true)).toBe("edit");
  });

  it("does not offer an invalid edit action after a quote has left draft", () => {
    expect(getQuoteDetailAction("approved", true, true)).toBeNull();
    expect(getQuoteDetailAction("rejected", false, true)).toBeNull();
  });
});
