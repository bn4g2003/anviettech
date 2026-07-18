# AnViet CRM

Mock CRM đầy đủ (Next.js 16 + Tailwind 4 + Zustand) — UI tiếng Việt, mật độ cao, quan hệ liên module.

## Chạy local

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) → chuyển tới `/khach-hang`.

## Cấu trúc

- `app/(crm)/` — route mỏng + `_components` theo màn
- `features/[domain]/` — types, services, hooks (domain)
- `features/shared/repository` — **duy nhất** cầu nối tới store/persist
- `components/` — shell, UI primitives, DataGrid, lookups

UI **không** gọi `localStorage`. Persist chỉ qua Zustand trong store → repository → services.

## Modules

| Route | Module |
|-------|--------|
| `/khach-hang` | Khách hàng |
| `/co-hoi` | Cơ hội (list + kanban) |
| `/cong-viec` | Công việc & lịch |
| `/san-pham` | Sản phẩm |
| `/bao-gia` | Báo giá & đơn hàng |
| `/hop-dong` | Hợp đồng |
| `/kho` | Kho xuất nhập |
| `/tai-chinh` | Hóa đơn / thanh toán / công nợ |
| `/marketing` | Chiến dịch |
| `/phan-tich` | Phân tích HĐKD |

Nút **Reset demo** ở sidebar khôi phục seed data.
