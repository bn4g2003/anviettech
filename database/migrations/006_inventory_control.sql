-- Sprint 4: serial traceability and stock-count records. Existing stock is unchanged.
CREATE TABLE IF NOT EXISTS serial_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  serial varchar(160) NOT NULL UNIQUE,
  warehouse_id uuid REFERENCES warehouses(id),
  customer_id uuid REFERENCES customers(id),
  project_id uuid REFERENCES projects(id),
  status varchar(32) NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock','installed','warranty','damaged','returned')),
  warranty_until date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS serial_numbers_product_active_idx ON serial_numbers(product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS serial_numbers_warehouse_active_idx ON serial_numbers(warehouse_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  status varchar(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted','cancelled')),
  counted_at timestamptz NOT NULL DEFAULT now(), note text,
  owner_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  posted_at timestamptz, deleted_at timestamptz
);
CREATE TABLE IF NOT EXISTS inventory_count_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_count_id uuid NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  expected_qty numeric(18,3) NOT NULL, counted_qty numeric(18,3) NOT NULL CHECK (counted_qty >= 0),
  UNIQUE(inventory_count_id, product_id)
);
CREATE INDEX IF NOT EXISTS inventory_counts_warehouse_active_idx ON inventory_counts(warehouse_id) WHERE deleted_at IS NULL;
