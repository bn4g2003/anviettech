CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE record_scope AS ENUM ('all', 'own');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(100) NOT NULL UNIQUE,
  description text, is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), module varchar(64) NOT NULL,
  action varchar(32) NOT NULL, scope record_scope NOT NULL DEFAULT 'own',
  UNIQUE(module, action, scope)
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name varchar(160) NOT NULL,
  email varchar(254) NOT NULL UNIQUE, password_hash text NOT NULL,
  status user_status NOT NULL DEFAULT 'active', must_change_password boolean NOT NULL DEFAULT true,
  last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE TABLE user_roles (user_id uuid NOT NULL REFERENCES users(id), role_id uuid NOT NULL REFERENCES roles(id), PRIMARY KEY(user_id, role_id));
CREATE TABLE role_permissions (role_id uuid NOT NULL REFERENCES roles(id), permission_id uuid NOT NULL REFERENCES permissions(id), PRIMARY KEY(role_id, permission_id));
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz
);
CREATE INDEX sessions_active_idx ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE TABLE login_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(254) NOT NULL, user_id uuid REFERENCES users(id),
  succeeded boolean NOT NULL, ip inet, user_agent text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES users(id), module varchar(64) NOT NULL, action varchar(64) NOT NULL,
  entity_type varchar(64) NOT NULL, entity_id uuid, before_data jsonb, after_data jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaigns (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, name varchar(255) NOT NULL, channel varchar(32) NOT NULL, status varchar(32) NOT NULL DEFAULT 'draft', budget numeric(18,2) NOT NULL DEFAULT 0, spent numeric(18,2) NOT NULL DEFAULT 0, start_date date, end_date date, owner_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, name varchar(255) NOT NULL, company_name varchar(255), email varchar(254), phone varchar(32), source varchar(100), status varchar(32) NOT NULL DEFAULT 'new', owner_id uuid REFERENCES users(id), campaign_id uuid REFERENCES campaigns(id), notes text, lost_reason text, converted_customer_id uuid, converted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE customers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, name varchar(255) NOT NULL, type varchar(16) NOT NULL DEFAULT 'company', status varchar(32) NOT NULL DEFAULT 'active', email varchar(254), phone varchar(32), address text, source varchar(100), owner_id uuid REFERENCES users(id), campaign_id uuid REFERENCES campaigns(id), notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
ALTER TABLE leads ADD CONSTRAINT leads_converted_customer_fk FOREIGN KEY (converted_customer_id) REFERENCES customers(id);
CREATE TABLE contacts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES customers(id), full_name varchar(255) NOT NULL, job_title varchar(160), email varchar(254), phone varchar(32), is_primary boolean NOT NULL DEFAULT false, notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE UNIQUE INDEX contacts_primary_idx ON contacts(customer_id) WHERE is_primary AND deleted_at IS NULL;
CREATE TABLE products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sku varchar(80) NOT NULL UNIQUE, name varchar(255) NOT NULL, category varchar(120), unit varchar(32) NOT NULL, unit_price numeric(18,2) NOT NULL DEFAULT 0, vat_percent numeric(5,2) NOT NULL DEFAULT 0, min_stock numeric(18,3) NOT NULL DEFAULT 0, status varchar(32) NOT NULL DEFAULT 'active', description text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE deals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, title varchar(255) NOT NULL, customer_id uuid NOT NULL REFERENCES customers(id), contact_id uuid REFERENCES contacts(id), stage varchar(32) NOT NULL DEFAULT 'new', value numeric(18,2) NOT NULL DEFAULT 0, probability smallint NOT NULL DEFAULT 10 CHECK(probability BETWEEN 0 AND 100), expected_close_date date, owner_id uuid REFERENCES users(id), notes text, closed_reason text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE deal_products (deal_id uuid NOT NULL REFERENCES deals(id), product_id uuid NOT NULL REFERENCES products(id), PRIMARY KEY(deal_id, product_id));
CREATE TABLE tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(255) NOT NULL, type varchar(32) NOT NULL, status varchar(32) NOT NULL DEFAULT 'open', due_at timestamptz, owner_id uuid REFERENCES users(id), customer_id uuid REFERENCES customers(id), lead_id uuid REFERENCES leads(id), deal_id uuid REFERENCES deals(id), notes text, completed_at timestamptz, completed_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE activities (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type varchar(32) NOT NULL, subject varchar(255) NOT NULL, content text, occurred_at timestamptz NOT NULL DEFAULT now(), owner_id uuid REFERENCES users(id), customer_id uuid REFERENCES customers(id), lead_id uuid REFERENCES leads(id), deal_id uuid REFERENCES deals(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE quotes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, customer_id uuid NOT NULL REFERENCES customers(id), deal_id uuid REFERENCES deals(id), status varchar(32) NOT NULL DEFAULT 'draft', valid_until date, owner_id uuid REFERENCES users(id), terms text, subtotal numeric(18,2) NOT NULL DEFAULT 0, total numeric(18,2) NOT NULL DEFAULT 0, approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE quote_lines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES products(id), product_name varchar(255) NOT NULL, qty numeric(18,3) NOT NULL CHECK(qty>0), unit_price numeric(18,2) NOT NULL, discount_percent numeric(5,2) NOT NULL DEFAULT 0, vat_percent numeric(5,2) NOT NULL DEFAULT 0, line_total numeric(18,2) NOT NULL);
CREATE TABLE contracts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, customer_id uuid NOT NULL REFERENCES customers(id), quote_id uuid UNIQUE REFERENCES quotes(id), deal_id uuid REFERENCES deals(id), status varchar(32) NOT NULL DEFAULT 'draft', value numeric(18,2) NOT NULL DEFAULT 0, start_date date, end_date date, owner_id uuid REFERENCES users(id), terms text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, customer_id uuid NOT NULL REFERENCES customers(id), contract_id uuid REFERENCES contracts(id), quote_id uuid UNIQUE REFERENCES quotes(id), status varchar(32) NOT NULL DEFAULT 'draft', owner_id uuid REFERENCES users(id), total numeric(18,2) NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE order_lines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES products(id), product_name varchar(255) NOT NULL, qty numeric(18,3) NOT NULL CHECK(qty>0), unit_price numeric(18,2) NOT NULL, line_total numeric(18,2) NOT NULL);
CREATE TABLE warehouses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, name varchar(160) NOT NULL, address text, is_default boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE inventory_balances (warehouse_id uuid NOT NULL REFERENCES warehouses(id), product_id uuid NOT NULL REFERENCES products(id), qty numeric(18,3) NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(warehouse_id, product_id));
CREATE TABLE stock_moves (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, type varchar(16) NOT NULL, status varchar(32) NOT NULL DEFAULT 'draft', order_id uuid REFERENCES orders(id), warehouse_from_id uuid REFERENCES warehouses(id), warehouse_to_id uuid REFERENCES warehouses(id), owner_id uuid REFERENCES users(id), note text, posted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE stock_move_lines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), stock_move_id uuid NOT NULL REFERENCES stock_moves(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES products(id), product_name varchar(255) NOT NULL, qty numeric(18,3) NOT NULL CHECK(qty>0));
CREATE TABLE invoices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, customer_id uuid NOT NULL REFERENCES customers(id), order_id uuid UNIQUE REFERENCES orders(id), contract_id uuid REFERENCES contracts(id), status varchar(32) NOT NULL DEFAULT 'unpaid', amount numeric(18,2) NOT NULL, paid_amount numeric(18,2) NOT NULL DEFAULT 0, due_date date, owner_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, invoice_id uuid NOT NULL REFERENCES invoices(id), customer_id uuid NOT NULL REFERENCES customers(id), amount numeric(18,2) NOT NULL CHECK(amount>0), method varchar(32) NOT NULL, paid_at timestamptz NOT NULL, owner_id uuid REFERENCES users(id), note text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id), deleted_at timestamptz);
CREATE TABLE documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity_type varchar(32) NOT NULL, entity_id uuid NOT NULL, original_name varchar(255) NOT NULL, storage_key varchar(255) NOT NULL UNIQUE, mime_type varchar(100) NOT NULL, size_bytes integer NOT NULL CHECK(size_bytes>=0), uploaded_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE INDEX customers_search_idx ON customers(owner_id, status) WHERE deleted_at IS NULL;
CREATE INDEX leads_search_idx ON leads(owner_id, status) WHERE deleted_at IS NULL;
CREATE INDEX deals_pipeline_idx ON deals(owner_id, stage, expected_close_date) WHERE deleted_at IS NULL;
CREATE INDEX tasks_due_idx ON tasks(owner_id, status, due_at) WHERE deleted_at IS NULL;
CREATE INDEX documents_entity_idx ON documents(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX audit_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);
