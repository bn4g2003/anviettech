-- Sprint 3: identify the business purpose and counterparty of every new stock movement.
ALTER TABLE stock_moves
  ADD COLUMN IF NOT EXISTS reason varchar(40),
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id),
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_moves_reason_check') THEN
    ALTER TABLE stock_moves ADD CONSTRAINT stock_moves_reason_check
      CHECK (reason IS NULL OR reason IN (
        'purchase_receipt', 'customer_return', 'warranty_receipt',
        'installation_issue', 'sales_issue', 'supplier_return', 'transfer'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS stock_moves_supplier_active_idx ON stock_moves(supplier_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS stock_moves_customer_active_idx ON stock_moves(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS stock_moves_project_active_idx ON stock_moves(project_id) WHERE deleted_at IS NULL;
