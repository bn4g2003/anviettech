-- Kế toán cần tra cứu sản phẩm và công trình khi ghi chi tiết doanh thu.
-- Chỉ thêm quyền xem; không cấp quyền tạo, sửa hoặc xóa các danh mục này.
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON p.module IN ('products', 'projects')
 AND p.action = 'view'
 AND p.scope = 'all'
WHERE r.name = 'Kế toán'
ON CONFLICT DO NOTHING;
