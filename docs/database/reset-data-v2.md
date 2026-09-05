# Reset dữ liệu nghiệp vụ v2

Dùng `database/reset_data_v2.sql` thay cho `database/reset_data.sql` cũ. Đây là thao tác xóa dữ liệu, không phải migration hay bước bắt buộc khi deploy. Không đưa file reset vào thư mục migrations.

## Phạm vi

Đã đối chiếu 38 bảng trong schema, migrations 001–011 và PostgreSQL local:

- Xóa dữ liệu 32 bảng nghiệp vụ: CRM, remarketing/công việc, báo giá, hợp đồng, đơn hàng, hóa đơn, thanh toán, kho, nhà cung cấp, công trình, serial, kiểm kê, liên kết sản phẩm–nhà cung cấp, doanh thu, giảm trừ, chi phí, thông tin tài liệu, phiên đăng nhập và nhật ký.
- Giữ nguyên `roles`, `permissions`, `role_permissions`, kể cả phân quyền tùy chỉnh.
- `users` và `user_roles` chỉ giữ admin được chọn cùng các vai trò đã gán; bổ sung liên kết Super admin nếu thiếu.
- Giữ các bản ghi `warehouses`. Khôi phục `KHO-001` nếu bị xóa mềm hoặc tạo mới nếu chưa có, đặt đây là kho mặc định duy nhất. Kho đã có giữ nguyên UUID, tên và địa chỉ.

Script chỉ xóa metadata trong `documents`; không xóa file vật lý hoặc file trên dịch vụ lưu trữ. Nó không sửa cấu trúc bảng và không thêm dữ liệu demo. Dữ liệu còn lại trong file reset cũ không cần dọn riêng trước khi chạy v2.

## Tài khoản quản trị sau reset

Ưu tiên giữ tài khoản có UUID gốc `00000000-0000-0000-0000-000000000010`, kể cả đã đổi email. Nếu UUID này không còn, tìm tài khoản có email `admin@anviet.local` không phân biệt hoa/thường. Nếu có nhiều tài khoản trùng email theo cách so sánh này, script dừng và rollback.

Admin hiện có giữ nguyên tên, email, mật khẩu và cờ yêu cầu đổi mật khẩu. Trạng thái được khôi phục thành `active`, bỏ xóa mềm và xóa thời điểm đăng nhập cũ. Tất cả tài khoản khác bị xóa, kể cả tài khoản quản trị khác. Nếu UUID gốc và email mặc định thuộc hai người khác nhau, giữ người có UUID gốc.

Chỉ khi không tìm thấy admin, script tạo `admin@anviet.local` với mật khẩu tạm `Admin@123` và bắt buộc đổi mật khẩu sau đăng nhập. Hash này đã được kiểm tra bằng Argon2. Vai trò hệ thống Super admin có UUID `00000000-0000-0000-0000-000000000001` phải tồn tại; script không tự tạo lại cấu hình quyền.

## Chạy local

Sao lưu dữ liệu cần giữ và tạm dừng các thao tác trên ứng dụng trước khi reset. Database phải có schema và các migrations hiện hành. Trong PowerShell tại thư mục dự án, chạy toàn bộ file:

```powershell
Get-Content -Raw -Encoding UTF8 .\database\reset_data_v2.sql |
  docker compose exec -T postgres psql -X -U anviet -d anviet_crm -v ON_ERROR_STOP=1
```

Thay `anviet`/`anviet_crm` nếu cấu hình local dùng tên khác. Đây là lệnh thực sự xóa dữ liệu khi bạn chạy. Các bảng được xử lý trong một transaction: có lỗi trước COMMIT thì rollback toàn bộ. Nếu không lấy được khóa trong 5 giây, dừng để tránh chờ lâu; kiểm tra tác vụ đang dùng database trước khi thử lại.

## Chạy trên Neon

Chỉ thực hiện khi chủ động muốn xóa dữ liệu production. Sao lưu trước, chọn đúng project/branch/database và tạm dừng thao tác ghi từ ứng dụng. Mở SQL Editor, chạy toàn bộ nội dung `database/reset_data_v2.sql` trong một lần, bao gồm `BEGIN` và `COMMIT`. Không chạy từng đoạn riêng lẻ.

Nếu thiếu bảng, áp dụng migration tương ứng rồi mới chạy lại. Nếu thiếu vai trò Super admin, khôi phục cấu hình quyền trước. Nếu gặp khóa ngoại từ bảng ngoài danh sách, rà soát bảng đó; không thêm `CASCADE` để bỏ qua lỗi. Nếu kết nối vẫn báo transaction bị hủy sau lỗi, chạy `ROLLBACK;` trước khi tiếp tục. Sau COMMIT chỉ khôi phục được dữ liệu bằng bản sao lưu đã chuẩn bị.

Sau khi thành công, đăng nhập lại bằng tài khoản admin được giữ và mật khẩu hiện tại. Có thể kiểm tra kết quả bằng:

```sql
SELECT id, email, status, must_change_password, deleted_at FROM public.users;
SELECT u.email, r.name FROM public.user_roles ur
JOIN public.users u ON u.id = ur.user_id
JOIN public.roles r ON r.id = ur.role_id;
SELECT code, name, is_default, deleted_at FROM public.warehouses ORDER BY code;
```

## Kiểm thử không ảnh hưởng dữ liệu ứng dụng

Test mặc định đối chiếu danh sách bảng trong schema/migrations với script. Bật test PostgreSQL bằng lệnh dưới đây; mỗi test tạo database riêng có tên `anviet_reset_test_<UUID>` trong Docker local, nạp dữ liệu giả, chạy reset và xóa database tạm khi xong. Test không đọc `DATABASE_URL` và không chạy trên database `anviet_crm` hay Neon.

```powershell
$env:RUN_RESET_DB_TESTS = '1'
try {
  npm test -- database/reset-data-v2.test.ts database/migrations.test.ts
} finally {
  Remove-Item Env:RUN_RESET_DB_TESTS -ErrorAction SilentlyContinue
}
```

Nếu PostgreSQL local dùng username khác `anviet`, đặt `RESET_TEST_POSTGRES_USER` trước khi chạy. Bộ test kiểm tra xóa đủ dữ liệu, giữ quyền/mật khẩu, admin đổi email hoặc bị xóa mềm, tạo lại admin còn thiếu, chạy lặp, và rollback khi thiếu bảng, thiếu vai trò, có khóa ngoại ngoài phạm vi hoặc lỗi ở bước cuối.
