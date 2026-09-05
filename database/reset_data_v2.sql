-- ============================================================================
-- ANVIET CRM - RESET DỮ LIỆU NGHIỆP VỤ V2
-- ============================================================================
-- Mục đích: làm sạch dữ liệu phát sinh để khởi tạo lại môi trường demo/test.
--
-- Giữ lại:
--   - Vai trò, quyền và cấu hình quyền (roles, permissions, role_permissions)
--   - Admin có UUID gốc ...0010 (kể cả đã đổi email); nếu UUID không còn thì
--     tìm theo email admin@anviet.local, không phân biệt hoa/thường
--   - UUID, tên, email, mật khẩu và yêu cầu đổi mật khẩu của admin hiện có
--   - Cấu hình các kho (warehouses); KHO-001 được bảo đảm là kho mặc định
--
-- Xóa toàn bộ dữ liệu nghiệp vụ, bao gồm các bảng được bổ sung sau reset_data.sql
-- cũ: nhà cung cấp, công trình, serial, kiểm kê, nhà cung cấp của sản phẩm,
-- chi tiết doanh thu và khoản giảm trừ doanh thu.
--
-- CẢNH BÁO: Script này KHÔNG THỂ hoàn tác sau khi COMMIT.
-- Chỉ chạy sau khi đã áp dụng toàn bộ database/migrations, và hãy sao lưu trước
-- khi chạy trên bất kỳ cơ sở dữ liệu nào có dữ liệu thật. Tạm dừng thao tác trên
-- ứng dụng trong lúc reset. Mọi phiên đăng nhập đều bị xóa, cần đăng nhập lại.
-- Nếu admin chưa tồn tại, tạo admin@anviet.local với mật khẩu tạm Admin@123,
-- bắt buộc đổi mật khẩu sau đăng nhập. KHÔNG ghi đè mật khẩu admin đã tồn tại.
-- Hướng dẫn local/Neon và kiểm thử: docs/database/reset-data-v2.md
-- ============================================================================

BEGIN;

SET LOCAL search_path = public, pg_catalog;
SET LOCAL lock_timeout = '5s';

-- UUID này cũng được users-service.ts sử dụng để bảo vệ Super admin cuối cùng.
-- Bảng roles không có cột code. Không tự tạo lại cấu hình phân quyền bị thiếu.
DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.roles
    WHERE id = '00000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'Thiếu vai trò hệ thống Super admin (...0001). Khôi phục cấu hình phân quyền trước khi reset.';
  END IF;
END
$preflight$;

-- Đối chiếu schema + migrations 001–011: xóa 32 bảng, giữ/xử lý riêng 6 bảng.
-- RESTRICT dừng nếu có bảng ngoài danh sách tham chiếu vào đây; không tự xóa lan.
-- Nếu thiếu bảng do chưa chạy migration, toàn bộ transaction sẽ thất bại.
TRUNCATE TABLE
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

DO $reset_admin$
DECLARE
  kept_admin_id uuid;
BEGIN
  -- Ưu tiên UUID gốc để không xóa admin khi người dùng đã thay đổi email.
  SELECT id INTO kept_admin_id FROM public.users
  WHERE id = '00000000-0000-0000-0000-000000000010';

  IF kept_admin_id IS NULL THEN
    BEGIN
      SELECT id INTO STRICT kept_admin_id FROM public.users
      WHERE lower(email) = 'admin@anviet.local';
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        kept_admin_id := NULL;
      WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Có nhiều tài khoản trùng email admin@anviet.local (khác hoa/thường). Cần xác định admin trước khi reset.';
    END;
  END IF;

  IF kept_admin_id IS NULL THEN
    -- Chỉ dùng mật khẩu seed khi tạo mới; đã kiểm tra bằng Argon2 verify.
    INSERT INTO public.users (id, full_name, email, password_hash, status, must_change_password)
    VALUES (
      '00000000-0000-0000-0000-000000000010',
      'Quản trị AnViet',
      'admin@anviet.local',
      '$argon2id$v=19$m=65536,p=4,t=3$ZGCYoyqcpTEHnZhM9dqmGA$kUg0U3+R/LN3IaPq6Xh9m7sc/iOy33yCyC1aUWA1nG0',
      'active', true
    ) RETURNING id INTO kept_admin_id;
  END IF;

  DELETE FROM public.user_roles WHERE user_id <> kept_admin_id;
  DELETE FROM public.users WHERE id <> kept_admin_id;

  -- deleted_at phải được xóa thì luồng đăng nhập mới tìm thấy tài khoản.
  UPDATE public.users
  SET status = 'active', deleted_at = NULL, last_login_at = NULL, updated_at = now()
  WHERE id = kept_admin_id;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (kept_admin_id, '00000000-0000-0000-0000-000000000001')
  ON CONFLICT (user_id, role_id) DO NOTHING;
END
$reset_admin$;

-- Giữ các cấu hình kho hiện có nhưng chuẩn hóa Kho trung tâm là kho mặc định.
UPDATE public.warehouses
SET is_default = false,
    updated_at = now()
WHERE is_default = true
  AND code <> 'KHO-001';

-- Kho đã có giữ nguyên UUID, tên, địa chỉ; chỉ khôi phục và đặt làm mặc định.
INSERT INTO public.warehouses (code, name, is_default)
VALUES ('KHO-001', 'Kho trung tâm', true)
ON CONFLICT (code) DO UPDATE
SET
  is_default = true,
  deleted_at = NULL,
  updated_at = now();

COMMIT;
