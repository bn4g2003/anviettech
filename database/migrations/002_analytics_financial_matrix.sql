-- Migration 002: fields required by the financial matrix.
-- This migration is schema-only. Demo data must never be applied automatically.

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric(18,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_type varchar(50) NOT NULL DEFAULT 'new_construction';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type varchar(50) NOT NULL DEFAULT 'new_construction';
ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS cost_price numeric(18,2) NOT NULL DEFAULT 0;
ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS business_type varchar(50) NOT NULL DEFAULT 'new_construction';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_type varchar(50) NOT NULL DEFAULT 'new_construction';

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_type varchar(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS site_address text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_technician_id uuid REFERENCES users(id);

CREATE TABLE IF NOT EXISTS operating_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40),
  expense_category varchar(64) NOT NULL DEFAULT 'other',
  amount numeric(18,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  deleted_at timestamptz
);

ALTER TABLE operating_expenses ALTER COLUMN code DROP NOT NULL;
ALTER TABLE operating_expenses ADD COLUMN IF NOT EXISTS period_date date;
ALTER TABLE operating_expenses ADD COLUMN IF NOT EXISTS category varchar(64);
ALTER TABLE operating_expenses ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS operating_expenses_date_idx
  ON operating_expenses(expense_date, expense_category)
  WHERE deleted_at IS NULL;
