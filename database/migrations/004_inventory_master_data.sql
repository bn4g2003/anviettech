-- Sprint 2: master data required before inventory transactions are introduced.
-- Existing products are physical goods by default so current sales and stock data stay valid.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS item_type varchar(16) NOT NULL DEFAULT 'goods';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_item_type_check'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_item_type_check CHECK (item_type IN ('goods', 'service'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  contact_name varchar(255),
  phone varchar(32),
  email varchar(254),
  address text,
  status varchar(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text,
  owner_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS suppliers_owner_active_idx ON suppliers(owner_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id),
  address text,
  status varchar(32) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  owner_id uuid REFERENCES users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  deleted_at timestamptz,
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS projects_customer_active_idx ON projects(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS projects_owner_active_idx ON projects(owner_id) WHERE deleted_at IS NULL;

-- Expose separate, adjustable permissions in the existing role matrix.
INSERT INTO permissions(module, action, scope)
SELECT module, action, scope
FROM unnest(ARRAY['suppliers', 'projects']) AS module
CROSS JOIN unnest(ARRAY['view', 'create', 'update', 'delete']) AS action
CROSS JOIN unnest(ARRAY['all'::record_scope, 'own'::record_scope]) AS scope
ON CONFLICT (module, action, scope) DO NOTHING;

-- System administrators receive every newly introduced permission automatically.
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Super admin', 'Admin')
  AND p.module IN ('suppliers', 'projects')
  AND p.scope = 'all'
ON CONFLICT DO NOTHING;

-- Operational defaults are intentionally narrow and remain editable in Role settings.
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.module = 'projects' AND p.scope = 'all'
WHERE r.name = 'Trưởng kinh doanh'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.module = 'projects' AND p.scope = 'own'
WHERE r.name = 'Nhân viên kinh doanh'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.module IN ('suppliers', 'warehouses') AND p.scope = 'all'
WHERE r.name = 'Kho'
ON CONFLICT DO NOTHING;
