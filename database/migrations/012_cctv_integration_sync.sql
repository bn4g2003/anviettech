-- Migration 012: Hỗ trợ tích hợp và đồng bộ tinh gọn từ CCTV sang CRM
-- 1. Bổ sung quyền phân quyền độc lập 'integrations'
INSERT INTO permissions (module, action, scope)
VALUES
  ('integrations', 'sync', 'all'),
  ('integrations', 'view', 'all')
ON CONFLICT (module, action, scope) DO NOTHING;

-- Cấp quyền mặc định cho Super admin và Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.module = 'integrations'
WHERE r.name IN ('Super admin', 'Admin')
ON CONFLICT DO NOTHING;

-- 2. Thêm trường định danh liên kết CCTV trên CRM
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cctv_customer_id uuid UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cctv_synced_at timestamptz;
CREATE INDEX IF NOT EXISTS customers_cctv_id_idx ON customers(cctv_customer_id) WHERE cctv_customer_id IS NOT NULL;

ALTER TABLE revenue_entries ADD COLUMN IF NOT EXISTS cctv_work_order_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS revenue_entries_cctv_wo_idx ON revenue_entries(cctv_work_order_id) WHERE cctv_work_order_id IS NOT NULL;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cctv_work_order_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS tasks_cctv_wo_idx ON tasks(cctv_work_order_id) WHERE cctv_work_order_id IS NOT NULL;

-- 3. Tạo bảng lưu nhật ký các lần bấm nút đồng bộ
CREATE TABLE IF NOT EXISTS cctv_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by uuid REFERENCES users(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status varchar(32) NOT NULL DEFAULT 'running',
  customers_count integer NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  error_message text
);
CREATE INDEX IF NOT EXISTS cctv_sync_logs_started_at_idx ON cctv_sync_logs(started_at DESC);

-- 4. Đảm bảo có sản phẩm dịch vụ kỹ thuật mặc định để gắn vào revenue_entries khi cần
INSERT INTO products (sku, name, category, unit, unit_price, status)
VALUES ('DV-CCTV', 'Dịch vụ kỹ thuật & lắp đặt CCTV', 'Dịch vụ', 'lần', 0, 'active')
ON CONFLICT (sku) DO NOTHING;
