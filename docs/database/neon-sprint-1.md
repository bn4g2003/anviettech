# Đồng bộ Neon — Sprint 1

Sprint 1 thêm cơ chế chống tạo trùng phiếu kho. Migration cần chạy trên Neon là `database/migrations/003_stock_move_idempotency.sql`.

## Trước khi chạy

1. Chọn đúng Neon project, branch và database production.
2. Tạo branch/backup trong Neon theo quy trình của bạn.
3. Xác nhận ứng dụng production chưa được deploy code Sprint 1 trước khi schema mới sẵn sàng.

Không chạy `database/init/*.sql`, `database/reset_data.sql`, hoặc bất kỳ script demo nào trên Neon.

## Chạy migration

Mở Neon SQL Editor cho đúng database, dán nội dung của `003_stock_move_idempotency.sql`, rồi chạy một lần. Migration chỉ thêm hai cột nullable và một unique partial index; không sửa hoặc xóa phiếu kho hiện có.

Sau đó kiểm tra:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'stock_moves'
  AND column_name IN ('request_id', 'request_hash')
ORDER BY column_name;

SELECT indexname
FROM pg_indexes
WHERE tablename = 'stock_moves'
  AND indexname = 'stock_moves_owner_request_id_unique';
```

Kết quả phải có hai cột `request_id`, `request_hash` và index `stock_moves_owner_request_id_unique`.

## Thứ tự deploy

1. Chạy và kiểm tra migration trên Neon.
2. Deploy code Sprint 1 lên Netlify.
3. Tạo thử một phiếu kho trên production và kiểm tra chỉ có một phiếu khi người dùng bấm lưu lặp lại.

## Lưu ý về migration 002

Migration `002_analytics_financial_matrix.sql` trong repository hiện chỉ còn schema. Nếu database Neon đã từng chạy bản cũ có dữ liệu mẫu, file mới không tự xóa dữ liệu đó. Cần đối soát riêng trước khi dọn dữ liệu, không xóa bằng câu lệnh diện rộng.
