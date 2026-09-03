-- Warehouse users need read-only access to the two CRM catalogues used by stock operations.
-- This is additive: it neither changes existing records nor expands write permissions.
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON p.module IN ('customers', 'projects')
  AND p.action = 'view'
  AND p.scope = 'all'
WHERE r.name = 'Kho'
ON CONFLICT DO NOTHING;
