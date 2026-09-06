-- Migration 014: High-performance Foreign Key & Query Indexes
-- Purpose: Eliminate Sequential Scans on core CRM relations (Invoices, Payments, Orders, Quotes, Lines, Tasks)

-- 1. Invoices & Payments (Finance Performance)
CREATE INDEX IF NOT EXISTS invoices_customer_active_idx ON invoices(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS invoices_status_due_idx ON invoices(status, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS payments_customer_active_idx ON payments(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS payments_invoice_active_idx ON payments(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS payments_paid_at_idx ON payments(paid_at DESC) WHERE deleted_at IS NULL;

-- 2. Quotes & Quote Lines
CREATE INDEX IF NOT EXISTS quotes_customer_active_idx ON quotes(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS quote_lines_quote_idx ON quote_lines(quote_id);
CREATE INDEX IF NOT EXISTS quote_lines_product_idx ON quote_lines(product_id);

-- 3. Orders & Order Lines
CREATE INDEX IF NOT EXISTS orders_customer_active_idx ON orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS order_lines_order_idx ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS order_lines_product_idx ON order_lines(product_id);

-- 4. Contracts & Deals & Tasks & Activities
CREATE INDEX IF NOT EXISTS contracts_customer_active_idx ON contracts(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS deals_customer_active_idx ON deals(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS tasks_customer_active_idx ON tasks(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS activities_customer_active_idx ON activities(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS contacts_customer_active_idx ON contacts(customer_id) WHERE deleted_at IS NULL;

-- 5. Inventory & Stock Moves
CREATE INDEX IF NOT EXISTS stock_move_lines_move_idx ON stock_move_lines(stock_move_id);
CREATE INDEX IF NOT EXISTS stock_move_lines_prod_idx ON stock_move_lines(product_id);
CREATE INDEX IF NOT EXISTS inventory_balances_prod_wh_idx ON inventory_balances(product_id, warehouse_id);

-- 6. Revenue Entries & Reductions
CREATE INDEX IF NOT EXISTS revenue_entries_customer_idx ON revenue_entries(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS revenue_reductions_entry_idx ON revenue_reductions(revenue_entry_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS revenue_reductions_customer_idx ON revenue_reductions(customer_id) WHERE deleted_at IS NULL;
