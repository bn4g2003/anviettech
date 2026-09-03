# Đồng bộ Neon — Nhà cung cấp của Sản phẩm

Chạy `database/migrations/008_product_suppliers.sql` trên Neon **trước** khi deploy code.

Migration chỉ tạo bảng `product_suppliers` và các index; không sửa sản phẩm, nhà cung cấp, tồn kho hoặc phiếu kho hiện có.

Kiểm tra sau khi chạy:

```sql
SELECT to_regclass('public.product_suppliers') AS product_suppliers;

SELECT indexname
FROM pg_indexes
WHERE tablename = 'product_suppliers'
ORDER BY indexname;
```

Kết quả phải có bảng `product_suppliers`, gồm index `product_suppliers_one_preferred_active` để mỗi sản phẩm chỉ có một nhà cung cấp ưu tiên đang hoạt động.
