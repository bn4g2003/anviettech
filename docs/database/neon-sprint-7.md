# Đồng bộ Neon — Điều hướng Danh mục Kho

Chạy `database/migrations/007_inventory_catalog_access.sql` trên Neon trước khi deploy code. Migration chỉ cấp quyền **xem toàn bộ** Khách hàng và Công trình cho role `Kho`; không thêm quyền tạo, sửa, xóa hoặc thay đổi dữ liệu.

Sau khi chạy, kiểm tra:

```sql
SELECT p.module, p.action, p.scope
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'Kho'
  AND p.module IN ('customers', 'projects')
  AND p.action = 'view'
  AND p.scope = 'all'
ORDER BY p.module;
```

Kết quả cần có hai dòng: `customers / view / all` và `projects / view / all`.

Sau khi deploy, tài khoản role Kho cần đăng xuất rồi đăng nhập lại để tải quyền mới.
