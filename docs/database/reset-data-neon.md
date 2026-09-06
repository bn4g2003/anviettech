# Hướng dẫn Reset Dữ liệu Hệ thống trên Neon PostgreSQL

Tài liệu này hướng dẫn cách sử dụng script `database/reset_data_neon.sql` để làm sạch toàn bộ dữ liệu nghiệp vụ và kiểm thử trên cơ sở dữ liệu Neon PostgreSQL, chuẩn bị môi trường sạch để bàn giao cho khách hàng đưa vào vận hành chính thức.

---

## 1. Căn cứ & Phạm vi đối chiếu

Script được xây dựng và đối chiếu trực tiếp từ file export hiện hành **`database/exportsql.sql`** (gồm **39 bảng** và **132 ràng buộc khóa ngoại**):

### Dữ liệu được BẢO TOÀN (Giữ lại 6 bảng):
1. **`roles`**: Giữ nguyên toàn bộ vai trò hệ thống (`Super admin`, `Admin`, `Trưởng kinh doanh`, `NVKD`, `Marketing`, `Kho`, `Kế toán`, `Chỉ xem`) và các vai trò tùy chỉnh.
2. **`permissions`**: Giữ nguyên toàn bộ 216+ danh mục quyền hạn của các module.
3. **`role_permissions`**: Giữ nguyên toàn bộ ma trận phân quyền chi tiết cho từng vai trò.
4. **`users` (Tài khoản Quản trị)**:
   - Tự động nhận diện và giữ lại **tất cả** tài khoản có vai trò `Super admin`, `Admin`, hoặc có UUID seed gốc `00000000-0000-0000-0000-000000000010`, hoặc email `admin@anviet.local`.
   - **Bảo toàn 100% mật khẩu hiện tại (Argon2id)**, họ tên, email mà khách hàng đang sử dụng. Không ghi đè mật khẩu.
   - Bỏ xóa mềm (`deleted_at = NULL`), khôi phục trạng thái `active`.
   - Nếu trong DB chưa có admin nào, tự động tạo `admin@anviet.local` với mật khẩu tạm `Admin@123` và bật cờ yêu cầu đổi mật khẩu.
   - Xóa toàn bộ tài khoản nhân viên / tài khoản kiểm thử (sales, kho, kế toán...).
5. **`user_roles`**: Giữ liên kết vai trò của các quản trị viên được giữ lại. Xóa quyền của các tài khoản nhân viên đã xóa.
6. **`warehouses` (Cấu hình Kho bãi)**:
   - Giữ nguyên toàn bộ các kho đã khai báo (UUID, mã kho, tên kho, địa chỉ).
   - Đảm bảo `KHO-001` (Kho trung tâm) luôn tồn tại, đang hoạt động và là kho mặc định duy nhất.

### Dữ liệu nghiệp vụ được XÓA SẠCH (33 bảng):
- **CRM & Khách hàng**: `campaigns`, `customers`, `contacts`, `leads`, `deals`, `deal_products`, `activities`, `tasks`, `projects`.
- **Bán hàng & Doanh thu**: `quotes`, `quote_lines`, `contracts`, `orders`, `order_lines`, `invoices`, `payments`, `revenue_entries`, `revenue_reductions`, `operating_expenses`.
- **Kỹ thuật & Công trình**: `field_jobs` *(bảng mới có trên Neon, đã được bổ sung để tránh lỗi khóa ngoại)*.
- **Kho & Sản phẩm**: `inventory_balances`, `stock_moves`, `stock_move_lines`, `inventory_counts`, `inventory_count_lines`, `serial_numbers`, `products`, `suppliers`, `product_suppliers`.
- **Hệ thống & Nhật ký**: `documents` (metadata), `sessions` (ép đăng xuất), `login_audits`, `audit_logs`.

---

## 2. Các bước chuẩn bị an toàn trên Neon

> [!WARNING]
> Thao tác Reset dữ liệu là **không thể hoàn tác** sau khi `COMMIT`. Hãy sao lưu trước khi thực hiện!

1. **Tạo bản sao lưu tức thì (Neon Branching)**:
   - Truy cập **Neon Console** -> Chọn Project của bạn -> Vào mục **Branches**.
   - Nhấn **Create Branch** đặt tên là `backup_before_reset_YYYYMMDD` từ branch hiện tại (`main`).
   - Thời gian tạo branch trên Neon chỉ mất 1–2 giây nhưng bảo đảm an toàn dữ liệu 100%.
2. **Tạm dừng thao tác từ người dùng**:
   - Khuyến nghị tạm dừng hoặc ngắt kết nối ứng dụng trong khoảng 1–2 phút để tránh phát sinh dữ liệu ghi đè đồng thời.

---

## 3. Cách chạy script Reset trên Neon

### Cách 1: Chạy trực tiếp qua Neon SQL Editor (Khuyên dùng)
1. Mở **Neon Console** -> Chọn Branch muốn reset (thường là `main`).
2. Vào mục **SQL Editor**.
3. Mở file [database/reset_data_neon.sql](file:///d:/freeland/AnvietFL/anviettech/database/reset_data_neon.sql), copy toàn bộ nội dung.
4. Dán vào Neon SQL Editor.
5. Nhấn **Run** (chạy toàn bộ file trong 1 lần duy nhất, bao gồm cả `BEGIN;` và `COMMIT;`).

### Cách 2: Chạy qua psql từ dòng lệnh (nếu đã cài PostgreSQL CLI)
```powershell
psql "postgres://[user]:[password]@[neon-host]/[dbname]?sslmode=require" -f .\database\reset_data_neon.sql
```

---

## 4. Kiểm tra kết quả sau khi Reset

Sau khi script chạy xong, bạn có thể chạy các truy vấn sau trên Neon SQL Editor để xác nhận hệ thống đã sẵn sàng:

```sql
-- 1. Kiểm tra tài khoản Quản trị còn lại (chỉ còn admin, status = 'active', deleted_at IS NULL)
SELECT id, full_name, email, status, must_change_password, deleted_at 
FROM public.users;

-- 2. Kiểm tra vai trò của Admin
SELECT u.email, r.name AS role_name 
FROM public.user_roles ur
JOIN public.users u ON u.id = ur.user_id
JOIN public.roles r ON r.id = ur.role_id;

-- 3. Kiểm tra danh sách Kho (KHO-001 là mặc định duy nhất)
SELECT code, name, is_default, deleted_at 
FROM public.warehouses 
ORDER BY code;

-- 4. Kiểm tra toàn bộ dữ liệu nghiệp vụ đã sạch về 0
SELECT 
  (SELECT count(*) FROM public.customers) AS total_customers,
  (SELECT count(*) FROM public.leads) AS total_leads,
  (SELECT count(*) FROM public.deals) AS total_deals,
  (SELECT count(*) FROM public.orders) AS total_orders,
  (SELECT count(*) FROM public.invoices) AS total_invoices,
  (SELECT count(*) FROM public.field_jobs) AS total_field_jobs,
  (SELECT count(*) FROM public.stock_moves) AS total_stock_moves,
  (SELECT count(*) FROM public.inventory_balances) AS total_inventory_balances,
  (SELECT count(*) FROM public.revenue_entries) AS total_revenue_entries;
```

Tất cả các số lượng nghiệp vụ ở truy vấn 4 phải trả về **`0`**.

---

## 5. Tùy chọn: Nếu muốn GIỮ LẠI danh mục Sản phẩm & Nhà cung cấp

Nếu khách hàng **đã nhập danh mục hàng hóa thật (`products`) và nhà cung cấp thật (`suppliers`)** và chỉ muốn reset giao dịch/tồn kho/đơn hàng:

Trong file `database/reset_data_neon.sql`:
1. Bỏ 3 bảng sau ra khỏi lệnh `TRUNCATE TABLE`:
   - `public.products,`
   - `public.suppliers,`
   - `public.product_suppliers,`
2. Bổ sung câu lệnh cập nhật quyền sở hữu các sản phẩm về cho Admin sau lệnh DELETE users:
   ```sql
   UPDATE public.products SET created_by = (SELECT user_id FROM temp_kept_admins LIMIT 1), updated_by = (SELECT user_id FROM temp_kept_admins LIMIT 1);
   UPDATE public.suppliers SET created_by = (SELECT user_id FROM temp_kept_admins LIMIT 1), updated_by = (SELECT user_id FROM temp_kept_admins LIMIT 1), owner_id = (SELECT user_id FROM temp_kept_admins LIMIT 1);
   ```
*(Số dư kho `inventory_balances` và các phiếu kho `stock_moves` vẫn sẽ bị xóa về 0 để khách hàng tiến hành nhập kho thực tế ban đầu).*
