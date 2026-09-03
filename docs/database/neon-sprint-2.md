# Đồng bộ Neon — Sprint 2

Sprint 2 bổ sung danh mục nhà cung cấp, công trình, và phân loại sản phẩm là hàng hóa hoặc dịch vụ. Migration cần chạy trên Neon là `database/migrations/004_inventory_master_data.sql`.

## Trước khi chạy

1. Chọn đúng Neon project, branch và database production.
2. Tạo branch hoặc backup theo quy trình của bạn.
3. Chạy xong và kiểm tra migration rồi mới deploy code Sprint 2 lên Netlify.

Không chạy `database/init/*.sql`, `database/reset_data.sql`, hoặc script seed/demo trên Neon.

## Chạy migration

Mở Neon SQL Editor cho đúng database, dán toàn bộ nội dung của `004_inventory_master_data.sql`, rồi chạy một lần.

Migration này:

- thêm `products.item_type`, mặc định `goods` cho mọi sản phẩm hiện có;
- tạo bảng `suppliers` và `projects` rỗng;
- thêm quyền `suppliers` và `projects`, đồng thời cấp mặc định cho các system role liên quan.

Nó không xóa dữ liệu, không đổi SKU, giá, tồn kho hay khách hàng hiện có.

## Kiểm tra sau khi chạy

```sql
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'item_type';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('suppliers', 'projects')
ORDER BY table_name;

SELECT module, count(*) AS permission_count
FROM permissions
WHERE module IN ('suppliers', 'projects')
GROUP BY module
ORDER BY module;
```

Kết quả mong đợi: một cột `item_type` có mặc định `goods`, hai bảng `projects`/`suppliers`, và mỗi module có 8 quyền (4 thao tác × 2 phạm vi).

## Thứ tự deploy

1. Chạy và kiểm tra migration trên Neon.
2. Deploy code Sprint 2 lên Netlify.
3. Đăng xuất/đăng nhập lại những tài khoản đang mở để tải quyền mới.
4. Trong **Cài đặt → Vai trò**, rà soát quyền Nhà cung cấp và Công trình theo chính sách công ty.

## Lưu ý quyền mặc định

- Super admin và Admin có quyền toàn bộ cho hai danh mục mới.
- Trưởng kinh doanh có toàn bộ quyền Công trình; nhân viên kinh doanh có quyền Công trình phạm vi cá nhân.
- Role Kho có toàn bộ quyền Nhà cung cấp.

Các cấp quyền này là mặc định để khởi động; có thể thay đổi bằng ma trận vai trò sau khi migration hoàn tất.
