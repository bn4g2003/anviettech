export const DEFAULT_PRODUCT_CATEGORIES = [
  "Thiết bị điện chính",
  "Thiết bị lưu trữ",
  "Vật tư",
  "Phụ kiện",
  "Dịch vụ",
] as const;

export type DefaultProductCategory = (typeof DEFAULT_PRODUCT_CATEGORIES)[number];
