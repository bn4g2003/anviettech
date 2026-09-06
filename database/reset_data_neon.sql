-- ============================================================================
-- ANVIET CRM / ERP - SCRIPT RESET DỮ LIỆU NGHIỆP VỤ HỆ THỐNG (NEON POSTGRESQL)
-- ============================================================================
-- Dựa trên cấu trúc thực tế từ: database/exportsql.sql (39 bảng, 132 khóa ngoại)
--
-- MỤC ĐÍCH:
--   Làm sạch toàn bộ dữ liệu mẫu / dữ liệu kiểm thử (giao dịch, khách hàng,
--   đơn hàng, kho, doanh thu, v.v.) để bàn giao hệ thống sạch đưa vào sử dụng thực tế.
--
-- CÁC DỮ LIỆU ĐƯỢC BẢO TOÀN (GIỮ LẠI NGUYÊN VẸN):
--   1. Phân quyền: Giữ 100% roles, permissions, role_permissions (kể cả vai trò tùy chỉnh).
--   2. Tài khoản Quản trị:
--      - Tự động nhận diện và giữ lại TẤT CẢ tài khoản có vai trò 'Super admin' hoặc 'Admin',
--        tài khoản có email 'admin@anviet.local', hoặc UUID gốc '...0010'.
--      - BẢO TOÀN NGUYÊN VẸN họ tên, email, mật khẩu hiện tại (Argon2id) và cờ đổi mật khẩu.
--      - Khôi phục trạng thái 'active', gỡ bỏ xóa mềm (deleted_at = NULL).
--      - Nếu hệ thống hoàn toàn chưa có admin nào, tự động tạo admin@anviet.local (Admin@123).
--      - Dọn sạch các tài khoản nhân viên / tài khoản con kiểm thử (sales, kho, kế toán...).
--   3. Cấu hình Kho bãi:
--      - Giữ lại toàn bộ danh sách kho bãi (warehouses) đã thiết lập (UUID, mã kho, tên, địa chỉ).
--      - Đảm bảo 'KHO-001' (Kho trung tâm) là kho mặc định duy nhất và đang hoạt động.
--
-- CÁC DỮ LIỆU NGHIỆP VỤ BỊ XÓA (33 BẢNG):
--   - CRM: campaigns, customers, contacts, leads, deals, deal_products, activities, tasks, projects.
--   - Bán hàng & Doanh thu: quotes, quote_lines, contracts, orders, order_lines, invoices,
--                           payments, revenue_entries, revenue_reductions, operating_expenses.
--   - Kỹ thuật & Hiện trường: field_jobs.
--   - Kho & Hàng hóa: inventory_balances, stock_moves, stock_move_lines, inventory_counts,
--                     inventory_count_lines, serial_numbers, products, suppliers, product_suppliers.
--   - Hệ thống & Nhật ký: documents, sessions, login_audits, audit_logs.
--
-- LƯU Ý QUAN TRỌNG TRƯỚC KHI CHẠY TRÊN NEON:
--   1. Hãy tạo bản sao lưu (Neon Branch hoặc pg_dump) trước khi thực thi.
--   2. Chạy toàn bộ file trong SQL Editor của Neon trong một lần (bao gồm BEGIN và COMMIT).
--   3. Script này sử dụng RESTRICT: nếu phát hiện bảng dữ liệu ngoài danh mục chưa được xử lý,
--      toàn bộ transaction sẽ lập tức ROLLBACK để bảo vệ tính toàn vẹn của database.
-- ============================================================================

BEGIN;

SET LOCAL search_path = public, pg_catalog;
SET LOCAL lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- BƯỚC 1: KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT (PREFLIGHT CHECK)
-- ----------------------------------------------------------------------------
DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.roles
    WHERE id = '00000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'Thiếu vai trò hệ thống Super admin (ID: ...0001). Cần khôi phục cấu hình phân quyền trước khi reset.';
  END IF;
END
$preflight$;

-- ----------------------------------------------------------------------------
-- BƯỚC 2: XÓA SẠCH DỮ LIỆU 33 BẢNG NGHIỆP VỤ & GIAO DỊCH
-- (Đã bao gồm bảng field_jobs mới có trong exportsql.sql trên Neon)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE
  public.field_jobs,
  public.revenue_reductions,
  public.revenue_entries,
  public.payments,
  public.invoices,
  public.inventory_count_lines,
  public.inventory_counts,
  public.serial_numbers,
  public.stock_move_lines,
  public.stock_moves,
  public.inventory_balances,
  public.order_lines,
  public.orders,
  public.contracts,
  public.quote_lines,
  public.quotes,
  public.deal_products,
  public.product_suppliers,
  public.deals,
  public.tasks,
  public.activities,
  public.contacts,
  public.leads,
  public.projects,
  public.customers,
  public.campaigns,
  public.products,
  public.suppliers,
  public.operating_expenses,
  public.documents,
  public.sessions,
  public.login_audits,
  public.audit_logs
RESTART IDENTITY RESTRICT;

-- ----------------------------------------------------------------------------
-- BƯỚC 3: DỌN DẸP & BẢO TOÀN TÀI KHOẢN QUẢN TRỊ (ADMIN USERS)
-- ----------------------------------------------------------------------------
DO $reset_admin$
DECLARE
  admin_count integer;
  seed_admin_id uuid := '00000000-0000-0000-0000-000000000010';
  super_admin_role_id uuid := '00000000-0000-0000-0000-000000000001';
  admin_role_id uuid := '00000000-0000-0000-0000-000000000002';
  chosen_admin_id uuid;
BEGIN
  -- Bảng tạm lưu danh sách tất cả các ID quản trị cần bảo vệ
  CREATE TEMP TABLE temp_kept_admins (
    user_id uuid PRIMARY KEY
  ) ON COMMIT DROP;

  -- 1. Giữ các tài khoản đang có vai trò Super admin hoặc Admin
  INSERT INTO temp_kept_admins (user_id)
  SELECT DISTINCT ur.user_id
  FROM public.user_roles ur
  WHERE ur.role_id IN (super_admin_role_id, admin_role_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Giữ tài khoản có UUID seed gốc (...0010) nếu tồn tại trong bảng users
  INSERT INTO temp_kept_admins (user_id)
  SELECT u.id
  FROM public.users u
  WHERE u.id = seed_admin_id
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Giữ tài khoản có email admin@anviet.local (không phân biệt hoa/thường)
  INSERT INTO temp_kept_admins (user_id)
  SELECT u.id
  FROM public.users u
  WHERE lower(u.email) = 'admin@anviet.local'
  ON CONFLICT (user_id) DO NOTHING;

  -- Đếm số tài khoản admin tìm thấy
  SELECT count(*) INTO admin_count FROM temp_kept_admins;

  -- 4. Nếu database hoàn toàn không có tài khoản quản trị nào, khởi tạo admin mặc định
  IF admin_count = 0 THEN
    INSERT INTO public.users (
      id,
      full_name,
      email,
      password_hash,
      status,
      must_change_password
    )
    VALUES (
      seed_admin_id,
      'Quản trị AnViet',
      'admin@anviet.local',
      -- Mật khẩu mặc định: Admin@123 (mã băm Argon2id đã kiểm định)
      '$argon2id$v=19$m=65536,p=4,t=3$ZGCYoyqcpTEHnZhM9dqmGA$kUg0U3+R/LN3IaPq6Xh9m7sc/iOy33yCyC1aUWA1nG0',
      'active',
      true
    )
    ON CONFLICT (email) DO UPDATE
    SET
      status = 'active',
      deleted_at = NULL,
      updated_at = now()
    RETURNING id INTO chosen_admin_id;

    INSERT INTO temp_kept_admins (user_id) VALUES (chosen_admin_id);
  END IF;

  -- 5. Xóa phân quyền của toàn bộ tài khoản nhân viên / tài khoản con
  DELETE FROM public.user_roles
  WHERE user_id NOT IN (SELECT user_id FROM temp_kept_admins);

  -- 6. Xóa tất cả tài khoản con trong bảng users (chỉ giữ lại admin)
  DELETE FROM public.users
  WHERE id NOT IN (SELECT user_id FROM temp_kept_admins);

  -- 7. Kích hoạt lại toàn bộ các admin được giữ (bỏ xóa mềm, xóa lịch sử đăng nhập cũ)
  UPDATE public.users
  SET
    status = 'active',
    deleted_at = NULL,
    last_login_at = NULL,
    updated_at = now()
  WHERE id IN (SELECT user_id FROM temp_kept_admins);

  -- 8. Đảm bảo có ít nhất một tài khoản admin được gán vai trò Super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN temp_kept_admins t ON t.user_id = ur.user_id
    WHERE ur.role_id = super_admin_role_id
  ) THEN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT user_id, super_admin_role_id
    FROM temp_kept_admins
    LIMIT 1
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

END
$reset_admin$;

-- ----------------------------------------------------------------------------
-- BƯỚC 4: BẢO TOÀN & CHUẨN HÓA CẤU HÌNH KHO BÃI (WAREHOUSES)
-- ----------------------------------------------------------------------------
-- Đảm bảo các kho khác không bị đặt cờ mặc định sai lệch
UPDATE public.warehouses
SET
  is_default = false,
  updated_at = now()
WHERE is_default = true
  AND code <> 'KHO-001';

-- Đảm bảo kho trung tâm KHO-001 luôn tồn tại, active và là kho mặc định duy nhất.
-- (Nếu KHO-001 đã tồn tại thì giữ nguyên UUID, tên, địa chỉ; chỉ kích hoạt và đặt mặc định)
INSERT INTO public.warehouses (code, name, is_default)
VALUES ('KHO-001', 'Kho trung tâm', true)
ON CONFLICT (code) DO UPDATE
SET
  is_default = true,
  deleted_at = NULL,
  updated_at = now();

COMMIT;

-- ============================================================================
-- KẾT THÚC SCRIPT RESET DỮ LIỆU NEON THÀNH CÔNG
-- ============================================================================
