-- ============================================================================
-- FILE: reset_data.sql
-- MỤC ĐÍCH: Reset toàn bộ dữ liệu nghiệp vụ và tài khoản nhân viên (tài khoản con).
-- GIỮ LẠI:
--   1. Cấu hình phân quyền: roles, permissions, role_permissions
--   2. Tài khoản quản trị tối cao: admin@anviet.local (Super admin)
--   3. Cấu hình kho mặc định: warehouses (Kho trung tâm)
-- ============================================================================

BEGIN;

-- 1. XÓA TOÀN BỘ DỮ LIỆU NGHIỆP VỤ & GIAO DỊCH (TRANSACTIONAL & BUSINESS DATA)
-- Sử dụng TRUNCATE ... CASCADE để dọn sạch dữ liệu nhanh chóng và an toàn về quan hệ khóa ngoại
TRUNCATE TABLE 
  payments,
  invoices,
  stock_move_lines,
  stock_moves,
  inventory_balances,
  order_lines,
  orders,
  contracts,
  quote_lines,
  quotes,
  deal_products,
  deals,
  tasks,
  activities,
  contacts,
  leads,
  customers,
  campaigns,
  products,
  operating_expenses,
  documents,
  sessions,
  login_audits,
  audit_logs
CASCADE;

-- 2. DỌN DẸP TÀI KHOẢN NGƯỜI DÙNG (CHỈ GIỮ LẠI TÀI KHOẢN ADMIN)
-- Xóa phân quyền vai trò của tất cả tài khoản con (không phải admin)
DELETE FROM user_roles 
WHERE user_id NOT IN (
  SELECT id FROM users 
  WHERE email = 'admin@anviet.local' 
     OR id = '00000000-0000-0000-0000-000000000010'
);

-- Xóa tất cả tài khoản con trong bảng users
DELETE FROM users 
WHERE email <> 'admin@anviet.local' 
  AND id <> '00000000-0000-0000-0000-000000000010';

-- 3. ĐẢM BẢO TÀI KHOẢN ADMIN MẶC ĐỊNH LUÔN TỒN TẠI VÀ ĐẦY ĐỦ QUYỀN
-- (Mật khẩu mặc định: Admin@123, mã băm Argon2id)
INSERT INTO users (
  id, 
  full_name, 
  email, 
  password_hash, 
  status, 
  must_change_password
)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Quản trị AnViet',
  'admin@anviet.local',
  '$argon2id$v=19$m=65536,p=4,t=3$ZGCYoyqcpTEHnZhM9dqmGA$kUg0U3+R/LN3IaPq6Xh9m7sc/iOy33yCyC1aUWA1nG0',
  'active',
  false
)
ON CONFLICT (email) DO UPDATE 
SET 
  status = 'active',
  updated_at = now();

-- Gán quyền Super admin cho tài khoản admin
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id, 
  '00000000-0000-0000-0000-000000000001' -- Super admin
FROM users u
WHERE u.email = 'admin@anviet.local'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4. ĐẢM BẢO KHO TRUNG TÂM MẶC ĐỊNH TỒN TẠI
INSERT INTO warehouses (id, code, name, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  'KHO-001',
  'Kho trung tâm',
  true
)
ON CONFLICT (code) DO NOTHING;

COMMIT;
