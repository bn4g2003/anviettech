# Đồng bộ Neon — Sprint 4

Chạy `database/migrations/006_inventory_control.sql` trên Neon trước khi deploy code Sprint 4.

Migration tạo ba bảng mới: `serial_numbers`, `inventory_counts`, `inventory_count_lines`. Nó không sửa tồn hiện hữu; chênh lệch chỉ được áp khi người có quyền duyệt ghi sổ phiếu kiểm kê.

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('serial_numbers','inventory_counts','inventory_count_lines')
ORDER BY table_name;
```

Kết quả phải có ba bảng. Không chạy script `init`, `reset_data` hoặc seed trên Neon.
