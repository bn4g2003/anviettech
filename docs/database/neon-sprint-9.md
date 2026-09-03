# Đồng bộ Neon — chi tiết doanh thu

Sau khi kiểm thử local đạt, mở Neon SQL Editor và chạy lần lượt nguyên nội dung hai file `database/migrations/009_finance_revenue_detail.sql` và `database/migrations/010_accountant_revenue_lookup_access.sql`, mỗi file đúng một lần.

Kiểm tra:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('revenue_entries', 'revenue_reductions')
ORDER BY table_name;
```

Migration 009 chỉ tạo bảng và chỉ mục; không thêm hay sửa số liệu doanh thu cũ. Migration 010 chỉ bổ sung cho vai trò Kế toán quyền xem Sản phẩm và Công trình để ghi chi tiết doanh thu.
