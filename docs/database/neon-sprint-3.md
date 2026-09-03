# Đồng bộ Neon — Sprint 3

Sprint 3 thêm ngữ cảnh nghiệp vụ cho phiếu kho: lý do nhập/xuất và liên kết tới nhà cung cấp, khách hàng hoặc công trình. Chạy `database/migrations/005_stock_move_business_context.sql` trên Neon trước khi deploy code Sprint 3.

Migration chỉ thêm các cột nullable và index; không đổi số tồn hoặc phiếu kho cũ.

Kiểm tra sau khi chạy:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'stock_moves'
  AND column_name IN ('reason', 'supplier_id', 'customer_id', 'project_id')
ORDER BY column_name;
```

Kết quả cần có bốn cột. Sau đó deploy code và tạo thử từng loại phiếu: nhập mua, khách trả, bảo hành, xuất lắp đặt, xuất bán, trả nhà cung cấp và điều chuyển.
