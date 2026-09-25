import { describe, expect, it } from "vitest";
import { optionItemsFromChildren } from "./select";

describe("optionItemsFromChildren", () => {
  it("keeps values, labels and disabled state from native option markup", () => {
    const options = optionItemsFromChildren(
      <>
        <option value="">Tất cả trạng thái</option>
        <option value="active">Đang hoạt động</option>
        <option value="inactive" disabled>Ngưng hoạt động</option>
      </>,
    );

    expect(options).toEqual([
      { value: "", label: "Tất cả trạng thái", disabled: false },
      { value: "active", label: "Đang hoạt động", disabled: false },
      { value: "inactive", label: "Ngưng hoạt động", disabled: true },
    ]);
  });
});
