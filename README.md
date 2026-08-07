# AnViet CRM

CRM vận hành với Next.js 16, PostgreSQL và API nội bộ. UI tiếng Việt, mật độ cao, quan hệ liên module. Dữ liệu product đọc/ghi PostgreSQL (không còn demo Zustand).

## Chạy local

```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) → `/dang-nhap`.

**Local/dev only:** seed tạo Super Admin `admin@anviet.local` (mật khẩu trong `database/init/002_seed.sql`). Đổi mật khẩu ngay lần đăng nhập đầu. **Không** dùng seed password trên môi trường public/staging/production — provision admin qua quy trình deploy an toàn.

`database/init/*.sql` chỉ chạy khi tạo volume lần đầu. Service `migrate` chạy các migration idempotent trong `database/migrations` mỗi lần `docker compose up`; kiểm tra bằng `docker compose logs migrate` và không bỏ qua lỗi migration khi deploy. Để seed lại môi trường local:

```bash
docker compose down -v && docker compose up -d
```

## Modules

| Route | Module |
|-------|--------|
| `/tiem-nang` | Lead / tiềm năng |
| `/khach-hang` | Khách hàng + workspace |
| `/co-hoi` | Cơ hội |
| `/cong-viec` | Công việc |
| `/san-pham` | Sản phẩm |
| `/bao-gia` | Báo giá & đơn hàng |
| `/hop-dong` | Hợp đồng |
| `/kho` | Kho xuất nhập |
| `/tai-chinh` | Hóa đơn / thanh toán / công nợ |
| `/marketing` | Chiến dịch |
| `/phan-tich` | Phân tích HĐKD (SQL) |
| `/cai-dat/nguoi-dung` | Người dùng |
| `/cai-dat/vai-tro` | Vai trò & quyền |

## Kiến trúc

- `app/(crm)/` — route mỏng + `_components`
- `app/api/v1/` — REST API, RBAC server-side
- `features/*/services` — domain services (client gọi API; server service trong `features/crm`, `features/sales`, `features/auth`)
- `database/init` — schema + seed PostgreSQL chỉ cho volume mới
- `database/migrations` — migration idempotent cho database đã tồn tại
