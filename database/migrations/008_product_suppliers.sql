CREATE TABLE IF NOT EXISTS product_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  supplier_sku varchar(160),
  purchase_price numeric(18,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  lead_time_days integer CHECK (lead_time_days >= 0),
  min_order_qty numeric(18,3) NOT NULL DEFAULT 1 CHECK (min_order_qty > 0),
  is_preferred boolean NOT NULL DEFAULT false,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz,
  UNIQUE(product_id, supplier_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS product_suppliers_one_preferred_active
  ON product_suppliers(product_id) WHERE is_preferred AND deleted_at IS NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS product_suppliers_supplier_active_idx
  ON product_suppliers(supplier_id, product_id) WHERE deleted_at IS NULL AND status = 'active';
