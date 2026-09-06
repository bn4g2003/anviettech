-- Migration 013: Hỗ trợ đồng bộ toàn diện Tài chính (Đơn hàng, Hóa đơn, Thanh toán) từ CCTV sang CRM
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cctv_work_order_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS orders_cctv_wo_idx ON orders(cctv_work_order_id) WHERE cctv_work_order_id IS NOT NULL;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cctv_work_order_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS invoices_cctv_wo_idx ON invoices(cctv_work_order_id) WHERE cctv_work_order_id IS NOT NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS cctv_work_order_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS payments_cctv_wo_idx ON payments(cctv_work_order_id) WHERE cctv_work_order_id IS NOT NULL;
