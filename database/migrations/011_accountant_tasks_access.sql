-- Kế toán tự quản lý các công việc được giao cho mình.
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000007', p.id
FROM permissions p
WHERE p.module = 'tasks'
  AND p.scope = 'own'
  AND p.action IN ('view', 'create', 'update', 'delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;
