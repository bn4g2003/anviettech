import { describe, expect, it } from "vitest";
import { parseOptionsFromChildren } from "./multi-select-filter";

describe("MultiSelectFilter", () => {
  it("parses options and placeholder title from option children", () => {
    const result = parseOptionsFromChildren(
      <>
        <option value="">Loại KH</option>
        <option value="company">Doanh nghiệp</option>
        <option value="individual">Cá nhân</option>
      </>
    );

    expect(result.titleFromPlaceholder).toBe("Loại KH");
    expect(result.options).toEqual([
      { value: "company", label: "Doanh nghiệp", disabled: false },
      { value: "individual", label: "Cá nhân", disabled: false },
    ]);
  });

  it("handles disabled options correctly", () => {
    const result = parseOptionsFromChildren(
      <>
        <option value="active">Đang hoạt động</option>
        <option value="inactive" disabled>Ngưng</option>
      </>
    );

    expect(result.options[1].disabled).toBe(true);
  });
});
