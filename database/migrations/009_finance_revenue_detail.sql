-- Chi tiết từng phát sinh doanh thu và khoản giảm trừ.
-- Migration chỉ bổ sung cấu trúc, không thay đổi hoặc suy diễn số liệu cũ.
CREATE TABLE IF NOT EXISTS revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  occurred_at date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  project_id uuid REFERENCES projects(id),
  product_id uuid NOT NULL REFERENCES products(id),
  employee_id uuid REFERENCES users(id),
  invoice_id uuid REFERENCES invoices(id),
  document_code varchar(80),
  business_type varchar(50) NOT NULL DEFAULT 'retail' CHECK (business_type IN ('new_construction','repair','warranty','retail')),
  qty numeric(18,3) NOT NULL CHECK (qty > 0),
  unit_price numeric(18,2) NOT NULL CHECK (unit_price >= 0),
  vat_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (vat_percent BETWEEN 0 AND 100),
  subtotal numeric(18,2) NOT NULL CHECK (subtotal >= 0),
  vat_amount numeric(18,2) NOT NULL CHECK (vat_amount >= 0),
  total_amount numeric(18,2) NOT NULL CHECK (total_amount >= 0),
  cost_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (cost_amount >= 0),
  payment_status varchar(16) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
  paid_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS revenue_entries_occurred_active_idx ON revenue_entries(occurred_at, business_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS revenue_entries_customer_active_idx ON revenue_entries(customer_id, occurred_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS revenue_entries_project_active_idx ON revenue_entries(project_id, occurred_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS revenue_reductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  occurred_at date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid REFERENCES customers(id),
  revenue_entry_id uuid REFERENCES revenue_entries(id),
  type varchar(24) NOT NULL CHECK (type IN ('discount','return','other')),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS revenue_reductions_occurred_active_idx ON revenue_reductions(occurred_at, type) WHERE deleted_at IS NULL;
