import { describe, expect, it } from "vitest";

import { LEAD_SOURCE_OPTIONS } from "./source-options";

describe("lead source options", () => {
  it("keeps Website and includes all configured business sources", () => {
    expect(LEAD_SOURCE_OPTIONS).toEqual([
      "Website",
      "Marketing",
      "Tự khai thác",
      "Công ty",
      "Đối tác",
    ]);
  });
});
