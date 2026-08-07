# AnViet CRM — Luồng nghiệp vụ bàn giao v1

Tài liệu này là nguồn kiểm soát bàn giao: một luồng chỉ được xem là hoàn tất khi người dùng có thể thực hiện từ UI, API kiểm tra quyền/validation, dữ liệu được lưu PostgreSQL và màn hình liên quan đọc lại cùng dữ liệu đó.

## Quy ước chung

- Người dùng chưa đăng nhập đi đến `/dang-nhap`; đăng nhập lần đầu bắt buộc đổi mật khẩu.
- Tất cả hành động kiểm tra quyền ở server: `view`, `create`, `update`, `delete`, `approve`, `export` với phạm vi `all` hoặc `own`.
- Tất cả danh sách có tìm kiếm, filter, sort, phân trang server-side và bốn trạng thái: loading, empty, error, forbidden.
- Form chỉ bật lưu khi đủ dữ liệu bắt buộc; lỗi API hiển thị tại field/form. Xóa, duyệt, hủy, chuyển đổi đều cần confirm dialog.
- Mã chứng từ do server sinh; người dùng không nhập hay sửa mã.

## 1. Quản trị tài khoản và quyền

**Tiền điều kiện:** Super admin/Admin đã đăng nhập.

1. Vào `Cài đặt → Người dùng`; hệ thống hiển thị danh sách tài khoản, vai trò, trạng thái, lần đăng nhập gần nhất.
2. Nhấn `Tạo tài khoản`, nhập họ tên, email, vai trò và mật khẩu tạm; API kiểm tra email duy nhất và role tồn tại.
3. Hệ thống tạo user `active`, `must_change_password=true`, ghi audit, hiển thị thông tin tạo thành công.
4. Người dùng nhận thông tin đăng nhập, đăng nhập và đổi mật khẩu trước khi vào CRM.
5. Admin có thể đổi vai trò hoặc vô hiệu hóa; hệ thống thu hồi session đang hoạt động khi vô hiệu hóa.
6. Vào `Cài đặt → Vai trò & quyền`, admin tạo/sửa role, bật từng quyền module × action × scope; thay đổi có hiệu lực ở request tiếp theo.

**Không cho phép:** xóa/vô hiệu hóa Super admin cuối cùng; tự hạ quyền tài khoản hiện tại; gán role không tồn tại.

## 2. Lead → Khách hàng → Cơ hội

**Tiền điều kiện:** Có người phụ trách; campaign là tùy chọn.

1. Vào `Tiềm năng`, nhấn `Tạo lead`, nhập tên liên hệ, công ty, điện thoại/email, nguồn, người phụ trách và ghi chú.
2. Lead mặc định `new`; salesperson ghi hoạt động hoặc tạo task follow-up ngay từ drawer/workspace.
3. Khi đủ điều kiện, nhấn `Đủ điều kiện` hoặc `Không phù hợp`; nếu không phù hợp phải nhập lý do.
4. Nhấn `Chuyển đổi`; modal hiển thị dữ liệu sẽ tạo: khách hàng bắt buộc, liên hệ chính, và tùy chọn cơ hội (tên + giá trị dự kiến).
5. API lock lead, kiểm tra lead chưa converted, transaction tạo customer/contact/deal, đánh dấu lead `converted` và audit.
6. Điều hướng sang hồ sơ khách hàng mới; timeline hiện sự kiện chuyển đổi và liên kết lead nguồn.

**Không cho phép:** chuyển đổi hai lần; tạo cơ hội không có khách hàng; xem/chuyển lead ngoài phạm vi quyền.

## 3. Khách hàng, liên hệ, hoạt động và công việc

**Tiền điều kiện:** Khách hàng có tên, loại, owner; liên hệ thuộc đúng khách hàng.

1. `Khách hàng` là bảng account/individual; tạo mới bằng modal, tạo liên hệ ngay trong workspace khách hàng.
2. Workspace có tab Tổng quan, Liên hệ, Hoạt động & việc, Cơ hội, Báo giá/đơn/hợp đồng, Công nợ, Tài liệu, Audit.
3. Từ tab hoạt động, user tạo call/email/meeting/note; từ tab việc tạo task có owner và hạn xử lý.
4. Hoàn thành/hủy task phải cập nhật trạng thái và timeline; task quá hạn được highlight.
5. Mọi bảng liên quan chỉ trả về dữ liệu customer đó, theo quyền người dùng.

**Không cho phép:** xóa customer khi có chứng từ phát sinh; chỉ cho inactive/soft-delete khi không có relation khóa.

## 4. Sản phẩm và tồn kho

**Tiền điều kiện:** Có ít nhất một warehouse mặc định trước khi xác nhận đơn; product có SKU duy nhất, đơn vị, đơn giá, VAT.

1. Admin/Kho tạo product bằng modal; chỉ product `active` xuất hiện trong dòng báo giá/đơn.
2. Kho tạo phiếu nhập, xuất thủ công hoặc chuyển kho; draft chưa thay đổi tồn.
3. Khi `post`, server lock balance, kiểm tra không âm với phiếu xuất, rồi cập nhật balance trong transaction.
4. Bảng tồn hiển thị tồn hiện tại và cảnh báo nhỏ hơn `min_stock`; click product mở lịch sử stock move.

**Không cho phép:** post hai lần; xuất vượt tồn; sửa/xóa phiếu posted (chỉ tạo chứng từ điều chỉnh).

## 5. Cơ hội → Báo giá → Hợp đồng/Đơn → Kho/Hóa đơn → Thanh toán

**Tiền điều kiện:** customer tồn tại; báo giá có ít nhất một dòng product active; warehouse đủ tồn khi xác nhận đơn.

1. Tạo cơ hội từ khách hàng hoặc trang Cơ hội: tên, customer, owner, stage `new`, giá trị, ngày dự kiến, sản phẩm tùy chọn.
2. Chuyển stage qua modal xác nhận. Stage `won`/`lost` yêu cầu lý do; chuyển stage ghi audit. Kanban chỉ là một cách thao tác cùng endpoint.
3. Tạo báo giá từ workspace customer/deal; form chọn customer, deal tùy chọn, ≥1 product, quantity, unit price, discount, VAT, hạn hiệu lực, điều khoản. Server tự tính line/subtotal/total.
4. Báo giá `draft → sent`; `approve/reject` cần confirm. Duyệt chạy transaction idempotent tạo đúng một hợp đồng active và một đơn draft từ quote lines.
5. Sales bổ sung/chỉnh đơn chỉ khi `draft`. Kho nhấn `Xác nhận đơn`, chọn warehouse; API lock order + balances, kiểm tồn, tạo phiếu xuất `posted`, giảm tồn, tạo hóa đơn `unpaid`, chuyển order `confirmed` trong một transaction.
6. Kế toán mở hóa đơn, nhấn `Ghi nhận thanh toán`, chọn method/date/amount ≤ còn phải thu. API lock invoice, tạo payment, cập nhật `paid_amount` và status `partial/paid` atomically.
7. Workspace customer, đơn, hóa đơn và dashboard đọc cùng dữ liệu PostgreSQL; mọi thay đổi xuất hiện trong activity/audit.

**Không cho phép:** duyệt quote đã approved/rejected; nhiều hợp đồng/đơn cho cùng quote; xác nhận đơn thiếu tồn; thu vượt hóa đơn; hủy chứng từ có chứng từ con.

## 6. Marketing và phân tích

1. Marketing tạo campaign (kênh, ngân sách, ngày, owner), cập nhật spent/status.
2. Lead có thể chọn campaign nguồn; dashboard campaign hiển thị lead, chuyển đổi và doanh thu theo campaign.
3. Analytics chỉ dùng SQL aggregate trên dữ liệu thật: pipeline theo stage, doanh thu theo invoice paid, công nợ, task quá hạn, top customer/product, tồn dưới mức tối thiểu.

## Checklist bàn giao theo luồng

| Luồng | UI đọc PostgreSQL | UI ghi API | Validation/RBAC | Transaction | E2E test |
|---|---:|---:|---:|---:|---:|
| Auth/RBAC | ✓ | ✓ | ✓ | session | cần bổ sung |
| Lead conversion | ✓ | ✓ | ✓ | ✓ | cần bổ sung |
| Customer workspace | ✓ | ✓ | ✓ | — | cần bổ sung |
| Product/warehouse | ✓ | ✓ | ✓ | ✓ | cần bổ sung |
| Quote → payment | ✓ | ✓ | ✓ | ✓ | cần bổ sung |
| Marketing/analytics | ✓ | ✓ | ✓ | — | cần bổ sung |

Mục tiêu bàn giao: các luồng ưu tiên đọc/ghi PostgreSQL thống nhất; không duy trì dual demo+DB trên cùng màn hình.
