CREATE SCHEMA "public";
CREATE TYPE "record_scope" AS ENUM('all', 'own');
CREATE TYPE "user_status" AS ENUM('active', 'inactive');
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" varchar(32) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"content" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"owner_id" uuid,
	"customer_id" uuid,
	"lead_id" uuid,
	"deal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_id" uuid,
	"module" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid,
	"before_data" jsonb,
	"after_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "campaigns_code_key" UNIQUE,
	"name" varchar(255) NOT NULL,
	"channel" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"budget" numeric(18, 2) DEFAULT '0' NOT NULL,
	"spent" numeric(18, 2) DEFAULT '0' NOT NULL,
	"start_date" date,
	"end_date" date,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"job_title" varchar(160),
	"email" varchar(254),
	"phone" varchar(32),
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "contracts_code_key" UNIQUE,
	"customer_id" uuid NOT NULL,
	"quote_id" uuid CONSTRAINT "contracts_quote_id_key" UNIQUE,
	"deal_id" uuid,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"start_date" date,
	"end_date" date,
	"owner_id" uuid,
	"terms" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"business_line" varchar(32) DEFAULT 'retail' NOT NULL,
	CONSTRAINT "contracts_business_line_chk" CHECK (((business_line)::text = ANY ((ARRAY['new_construction'::character varying, 'repair'::character varying, 'warranty'::character varying, 'retail'::character varying])::text[])))
);
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "customers_code_key" UNIQUE,
	"name" varchar(255) NOT NULL,
	"type" varchar(16) DEFAULT 'company' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"email" varchar(254),
	"phone" varchar(32),
	"address" text,
	"source" varchar(100),
	"owner_id" uuid,
	"campaign_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
CREATE TABLE "deal_products" (
	"deal_id" uuid,
	"product_id" uuid,
	CONSTRAINT "deal_products_pkey" PRIMARY KEY("deal_id","product_id")
);
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "deals_code_key" UNIQUE,
	"title" varchar(255) NOT NULL,
	"customer_id" uuid NOT NULL,
	"contact_id" uuid,
	"stage" varchar(32) DEFAULT 'new' NOT NULL,
	"value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"probability" smallint DEFAULT 10 NOT NULL,
	"expected_close_date" date,
	"owner_id" uuid,
	"notes" text,
	"closed_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"business_line" varchar(32) DEFAULT 'retail' NOT NULL,
	CONSTRAINT "deals_business_line_chk" CHECK (((business_line)::text = ANY ((ARRAY['new_construction'::character varying, 'repair'::character varying, 'warranty'::character varying, 'retail'::character varying])::text[]))),
	CONSTRAINT "deals_probability_check" CHECK (((probability >= 0) AND (probability <= 100)))
);
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_type" varchar(32) NOT NULL,
	"entity_id" uuid NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"storage_key" varchar(255) NOT NULL CONSTRAINT "documents_storage_key_key" UNIQUE,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "documents_size_bytes_check" CHECK ((size_bytes >= 0))
);
CREATE TABLE "field_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "field_jobs_code_key" UNIQUE,
	"title" varchar(255) NOT NULL,
	"job_type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"customer_id" uuid,
	"contract_id" uuid,
	"deal_id" uuid,
	"invoice_id" uuid,
	"site_address" text,
	"site_contact_name" varchar(160),
	"site_contact_phone" varchar(32),
	"scheduled_at" timestamp with time zone,
	"installed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"assigned_tech_user_id" uuid,
	"external_assignment_id" varchar(120),
	"external_sync_status" varchar(32) DEFAULT 'none' NOT NULL,
	"revenue_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"cogs_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "field_jobs_external_sync_status_check" CHECK (((external_sync_status)::text = ANY ((ARRAY['none'::character varying, 'pending'::character varying, 'synced'::character varying, 'error'::character varying])::text[]))),
	CONSTRAINT "field_jobs_job_type_check" CHECK (((job_type)::text = ANY ((ARRAY['new_construction'::character varying, 'repair'::character varying, 'warranty'::character varying, 'retail'::character varying])::text[]))),
	CONSTRAINT "field_jobs_status_check" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'assigned'::character varying, 'in_progress'::character varying, 'installed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);
CREATE TABLE "inventory_balances" (
	"warehouse_id" uuid,
	"product_id" uuid,
	"qty" numeric(18, 3) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_balances_pkey" PRIMARY KEY("warehouse_id","product_id")
);
CREATE TABLE "inventory_count_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"inventory_count_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"expected_qty" numeric(18, 3) NOT NULL,
	"counted_qty" numeric(18, 3) NOT NULL,
	CONSTRAINT "inventory_count_lines_inventory_count_id_product_id_key" UNIQUE("inventory_count_id","product_id"),
	CONSTRAINT "inventory_count_lines_counted_qty_check" CHECK ((counted_qty >= (0)::numeric))
);
CREATE TABLE "inventory_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "inventory_counts_code_key" UNIQUE,
	"warehouse_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"counted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "inventory_counts_status_check" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'posted'::character varying, 'cancelled'::character varying])::text[])))
);
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "invoices_code_key" UNIQUE,
	"customer_id" uuid NOT NULL,
	"order_id" uuid CONSTRAINT "invoices_order_id_key" UNIQUE,
	"contract_id" uuid,
	"status" varchar(32) DEFAULT 'unpaid' NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"due_date" date,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"business_line" varchar(32) DEFAULT 'retail' NOT NULL,
	"cogs_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"business_type" varchar(50) DEFAULT 'new_construction' NOT NULL,
	CONSTRAINT "invoices_business_line_chk" CHECK (((business_line)::text = ANY ((ARRAY['new_construction'::character varying, 'repair'::character varying, 'warranty'::character varying, 'retail'::character varying])::text[])))
);
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "leads_code_key" UNIQUE,
	"name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"email" varchar(254),
	"phone" varchar(32),
	"source" varchar(100),
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"owner_id" uuid,
	"campaign_id" uuid,
	"notes" text,
	"lost_reason" text,
	"converted_customer_id" uuid,
	"converted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
CREATE TABLE "login_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(254) NOT NULL,
	"user_id" uuid,
	"succeeded" boolean NOT NULL,
	"ip" inet,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "operating_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) CONSTRAINT "operating_expenses_code_key" UNIQUE,
	"expense_category" varchar(32) NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"description" text,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"period_date" date,
	"category" varchar(64),
	"notes" text,
	CONSTRAINT "operating_expenses_amount_check" CHECK ((amount >= (0)::numeric)),
	CONSTRAINT "operating_expenses_expense_category_check" CHECK (((expense_category)::text = ANY ((ARRAY['salary'::character varying, 'insurance'::character varying, 'office_rent'::character varying, 'tax'::character varying, 'admin'::character varying, 'tech_dept'::character varying, 'other'::character varying])::text[])))
);
CREATE TABLE "order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"qty" numeric(18, 3) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"line_total" numeric(18, 2) NOT NULL,
	"cost_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"business_type" varchar(50) DEFAULT 'new_construction' NOT NULL,
	CONSTRAINT "order_lines_qty_check" CHECK ((qty > (0)::numeric))
);
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "orders_code_key" UNIQUE,
	"customer_id" uuid NOT NULL,
	"contract_id" uuid,
	"quote_id" uuid CONSTRAINT "orders_quote_id_key" UNIQUE,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"owner_id" uuid,
	"total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"business_line" varchar(32) DEFAULT 'retail' NOT NULL,
	"business_type" varchar(50) DEFAULT 'new_construction' NOT NULL,
	CONSTRAINT "orders_business_line_chk" CHECK (((business_line)::text = ANY ((ARRAY['new_construction'::character varying, 'repair'::character varying, 'warranty'::character varying, 'retail'::character varying])::text[])))
);
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "payments_code_key" UNIQUE,
	"invoice_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"method" varchar(32) NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"owner_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "payments_amount_check" CHECK ((amount > (0)::numeric))
);
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"module" varchar(64) NOT NULL,
	"action" varchar(32) NOT NULL,
	"scope" record_scope DEFAULT 'own' NOT NULL,
	CONSTRAINT "permissions_module_action_scope_key" UNIQUE("module","action","scope")
);
CREATE TABLE "product_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_sku" varchar(160),
	"purchase_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"lead_time_days" integer,
	"min_order_qty" numeric(18, 3) DEFAULT '1' NOT NULL,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "product_suppliers_product_id_supplier_id_key" UNIQUE("product_id","supplier_id"),
	CONSTRAINT "product_suppliers_lead_time_days_check" CHECK ((lead_time_days >= 0)),
	CONSTRAINT "product_suppliers_min_order_qty_check" CHECK ((min_order_qty > (0)::numeric)),
	CONSTRAINT "product_suppliers_purchase_price_check" CHECK ((purchase_price >= (0)::numeric)),
	CONSTRAINT "product_suppliers_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"sku" varchar(80) NOT NULL CONSTRAINT "products_sku_key" UNIQUE,
	"name" varchar(255) NOT NULL,
	"category" varchar(120),
	"unit" varchar(32) NOT NULL,
	"unit_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"vat_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"min_stock" numeric(18, 3) DEFAULT '0' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"cost_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"business_type" varchar(50) DEFAULT 'new_construction' NOT NULL,
	"item_type" varchar(16) DEFAULT 'goods' NOT NULL,
	CONSTRAINT "products_item_type_check" CHECK (((item_type)::text = ANY ((ARRAY['goods'::character varying, 'service'::character varying])::text[])))
);
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "projects_code_key" UNIQUE,
	"name" varchar(255) NOT NULL,
	"customer_id" uuid NOT NULL,
	"address" text,
	"status" varchar(32) DEFAULT 'planning' NOT NULL,
	"start_date" date,
	"end_date" date,
	"owner_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "projects_check" CHECK (((end_date IS NULL) OR (start_date IS NULL) OR (end_date >= start_date))),
	CONSTRAINT "projects_status_check" CHECK (((status)::text = ANY ((ARRAY['planning'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);
CREATE TABLE "quote_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"quote_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"qty" numeric(18, 3) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"vat_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(18, 2) NOT NULL,
	CONSTRAINT "quote_lines_qty_check" CHECK ((qty > (0)::numeric))
);
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "quotes_code_key" UNIQUE,
	"customer_id" uuid NOT NULL,
	"deal_id" uuid,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"valid_until" date,
	"owner_id" uuid,
	"terms" text,
	"subtotal" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
CREATE TABLE "revenue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "revenue_entries_code_key" UNIQUE,
	"occurred_at" date DEFAULT CURRENT_DATE NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid,
	"product_id" uuid NOT NULL,
	"employee_id" uuid,
	"invoice_id" uuid,
	"document_code" varchar(80),
	"business_type" varchar(50) DEFAULT 'retail' NOT NULL,
	"qty" numeric(18, 3) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"vat_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(18, 2) NOT NULL,
	"vat_amount" numeric(18, 2) NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"cost_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"payment_status" varchar(16) DEFAULT 'unpaid' NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "revenue_entries_business_type_check" CHECK (((business_type)::text = ANY ((ARRAY['new_construction'::character varying, 'repair'::character varying, 'warranty'::character varying, 'retail'::character varying])::text[]))),
	CONSTRAINT "revenue_entries_cost_amount_check" CHECK ((cost_amount >= (0)::numeric)),
	CONSTRAINT "revenue_entries_paid_amount_check" CHECK ((paid_amount >= (0)::numeric)),
	CONSTRAINT "revenue_entries_payment_status_check" CHECK (((payment_status)::text = ANY ((ARRAY['unpaid'::character varying, 'partial'::character varying, 'paid'::character varying])::text[]))),
	CONSTRAINT "revenue_entries_qty_check" CHECK ((qty > (0)::numeric)),
	CONSTRAINT "revenue_entries_subtotal_check" CHECK ((subtotal >= (0)::numeric)),
	CONSTRAINT "revenue_entries_total_amount_check" CHECK ((total_amount >= (0)::numeric)),
	CONSTRAINT "revenue_entries_unit_price_check" CHECK ((unit_price >= (0)::numeric)),
	CONSTRAINT "revenue_entries_vat_amount_check" CHECK ((vat_amount >= (0)::numeric)),
	CONSTRAINT "revenue_entries_vat_percent_check" CHECK (((vat_percent >= (0)::numeric) AND (vat_percent <= (100)::numeric)))
);
CREATE TABLE "revenue_reductions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "revenue_reductions_code_key" UNIQUE,
	"occurred_at" date DEFAULT CURRENT_DATE NOT NULL,
	"customer_id" uuid,
	"revenue_entry_id" uuid,
	"type" varchar(24) NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "revenue_reductions_amount_check" CHECK ((amount > (0)::numeric)),
	CONSTRAINT "revenue_reductions_type_check" CHECK (((type)::text = ANY ((ARRAY['discount'::character varying, 'return'::character varying, 'other'::character varying])::text[])))
);
CREATE TABLE "role_permissions" (
	"role_id" uuid,
	"permission_id" uuid,
	CONSTRAINT "role_permissions_pkey" PRIMARY KEY("role_id","permission_id")
);
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL CONSTRAINT "roles_name_key" UNIQUE,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "serial_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"serial" varchar(160) NOT NULL CONSTRAINT "serial_numbers_serial_key" UNIQUE,
	"warehouse_id" uuid,
	"customer_id" uuid,
	"project_id" uuid,
	"status" varchar(32) DEFAULT 'in_stock' NOT NULL,
	"warranty_until" date,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "serial_numbers_status_check" CHECK (((status)::text = ANY ((ARRAY['in_stock'::character varying, 'installed'::character varying, 'warranty'::character varying, 'damaged'::character varying, 'returned'::character varying])::text[])))
);
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" char(64) NOT NULL CONSTRAINT "sessions_token_hash_key" UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
CREATE TABLE "stock_move_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"stock_move_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"qty" numeric(18, 3) NOT NULL,
	CONSTRAINT "stock_move_lines_qty_check" CHECK ((qty > (0)::numeric))
);
CREATE TABLE "stock_moves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "stock_moves_code_key" UNIQUE,
	"type" varchar(16) NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"order_id" uuid,
	"warehouse_from_id" uuid,
	"warehouse_to_id" uuid,
	"owner_id" uuid,
	"note" text,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"request_id" uuid,
	"request_hash" varchar(64),
	"reason" varchar(40),
	"supplier_id" uuid,
	"customer_id" uuid,
	"project_id" uuid,
	CONSTRAINT "stock_moves_reason_check" CHECK (((reason IS NULL) OR ((reason)::text = ANY ((ARRAY['purchase_receipt'::character varying, 'customer_return'::character varying, 'warranty_receipt'::character varying, 'installation_issue'::character varying, 'sales_issue'::character varying, 'supplier_return'::character varying, 'transfer'::character varying])::text[]))))
);
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "suppliers_code_key" UNIQUE,
	"name" varchar(255) NOT NULL,
	"contact_name" varchar(255),
	"phone" varchar(32),
	"email" varchar(254),
	"address" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"notes" text,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "suppliers_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'open' NOT NULL,
	"due_at" timestamp with time zone,
	"owner_id" uuid,
	"customer_id" uuid,
	"lead_id" uuid,
	"deal_id" uuid,
	"notes" text,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"work_type" varchar(50),
	"site_address" text,
	"assigned_technician_id" uuid
);
CREATE TABLE "user_roles" (
	"user_id" uuid,
	"role_id" uuid,
	CONSTRAINT "user_roles_pkey" PRIMARY KEY("user_id","role_id")
);
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"full_name" varchar(160) NOT NULL,
	"email" varchar(254) NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"password_hash" text NOT NULL,
	"status" user_status DEFAULT 'active' NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL CONSTRAINT "warehouses_code_key" UNIQUE,
	"name" varchar(160) NOT NULL,
	"address" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
CREATE UNIQUE INDEX "activities_pkey" ON "activities" ("id");
CREATE INDEX "audit_entity_idx" ON "audit_logs" ("entity_type","entity_id","created_at");
CREATE UNIQUE INDEX "audit_logs_pkey" ON "audit_logs" ("id");
CREATE UNIQUE INDEX "campaigns_code_key" ON "campaigns" ("code");
CREATE UNIQUE INDEX "campaigns_pkey" ON "campaigns" ("id");
CREATE UNIQUE INDEX "contacts_pkey" ON "contacts" ("id");
CREATE UNIQUE INDEX "contacts_primary_idx" ON "contacts" ("customer_id");
CREATE UNIQUE INDEX "contracts_code_key" ON "contracts" ("code");
CREATE UNIQUE INDEX "contracts_pkey" ON "contracts" ("id");
CREATE UNIQUE INDEX "contracts_quote_id_key" ON "contracts" ("quote_id");
CREATE UNIQUE INDEX "customers_code_key" ON "customers" ("code");
CREATE UNIQUE INDEX "customers_pkey" ON "customers" ("id");
CREATE INDEX "customers_search_idx" ON "customers" ("owner_id","status");
CREATE UNIQUE INDEX "deal_products_pkey" ON "deal_products" ("deal_id","product_id");
CREATE UNIQUE INDEX "deals_code_key" ON "deals" ("code");
CREATE INDEX "deals_pipeline_idx" ON "deals" ("owner_id","stage","expected_close_date");
CREATE UNIQUE INDEX "deals_pkey" ON "deals" ("id");
CREATE INDEX "documents_entity_idx" ON "documents" ("entity_type","entity_id");
CREATE UNIQUE INDEX "documents_pkey" ON "documents" ("id");
CREATE UNIQUE INDEX "documents_storage_key_key" ON "documents" ("storage_key");
CREATE UNIQUE INDEX "field_jobs_code_key" ON "field_jobs" ("code");
CREATE UNIQUE INDEX "field_jobs_pkey" ON "field_jobs" ("id");
CREATE INDEX "field_jobs_status_idx" ON "field_jobs" ("status","job_type","scheduled_at");
CREATE UNIQUE INDEX "inventory_balances_pkey" ON "inventory_balances" ("warehouse_id","product_id");
CREATE UNIQUE INDEX "inventory_count_lines_inventory_count_id_product_id_key" ON "inventory_count_lines" ("inventory_count_id","product_id");
CREATE UNIQUE INDEX "inventory_count_lines_pkey" ON "inventory_count_lines" ("id");
CREATE UNIQUE INDEX "inventory_counts_code_key" ON "inventory_counts" ("code");
CREATE UNIQUE INDEX "inventory_counts_pkey" ON "inventory_counts" ("id");
CREATE INDEX "inventory_counts_warehouse_active_idx" ON "inventory_counts" ("warehouse_id");
CREATE UNIQUE INDEX "invoices_code_key" ON "invoices" ("code");
CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices" ("order_id");
CREATE UNIQUE INDEX "invoices_pkey" ON "invoices" ("id");
CREATE UNIQUE INDEX "leads_code_key" ON "leads" ("code");
CREATE UNIQUE INDEX "leads_pkey" ON "leads" ("id");
CREATE INDEX "leads_search_idx" ON "leads" ("owner_id","status");
CREATE UNIQUE INDEX "login_audits_pkey" ON "login_audits" ("id");
CREATE UNIQUE INDEX "operating_expenses_code_key" ON "operating_expenses" ("code");
CREATE INDEX "operating_expenses_date_idx" ON "operating_expenses" ("expense_date","expense_category");
CREATE UNIQUE INDEX "operating_expenses_pkey" ON "operating_expenses" ("id");
CREATE UNIQUE INDEX "order_lines_pkey" ON "order_lines" ("id");
CREATE UNIQUE INDEX "orders_code_key" ON "orders" ("code");
CREATE UNIQUE INDEX "orders_pkey" ON "orders" ("id");
CREATE UNIQUE INDEX "orders_quote_id_key" ON "orders" ("quote_id");
CREATE UNIQUE INDEX "payments_code_key" ON "payments" ("code");
CREATE UNIQUE INDEX "payments_pkey" ON "payments" ("id");
CREATE UNIQUE INDEX "permissions_module_action_scope_key" ON "permissions" ("module","action","scope");
CREATE UNIQUE INDEX "permissions_pkey" ON "permissions" ("id");
CREATE UNIQUE INDEX "product_suppliers_one_preferred_active" ON "product_suppliers" ("product_id");
CREATE UNIQUE INDEX "product_suppliers_pkey" ON "product_suppliers" ("id");
CREATE UNIQUE INDEX "product_suppliers_product_id_supplier_id_key" ON "product_suppliers" ("product_id","supplier_id");
CREATE INDEX "product_suppliers_supplier_active_idx" ON "product_suppliers" ("supplier_id","product_id");
CREATE UNIQUE INDEX "products_pkey" ON "products" ("id");
CREATE UNIQUE INDEX "products_sku_key" ON "products" ("sku");
CREATE UNIQUE INDEX "projects_code_key" ON "projects" ("code");
CREATE INDEX "projects_customer_active_idx" ON "projects" ("customer_id");
CREATE INDEX "projects_owner_active_idx" ON "projects" ("owner_id");
CREATE UNIQUE INDEX "projects_pkey" ON "projects" ("id");
CREATE UNIQUE INDEX "quote_lines_pkey" ON "quote_lines" ("id");
CREATE UNIQUE INDEX "quotes_code_key" ON "quotes" ("code");
CREATE UNIQUE INDEX "quotes_pkey" ON "quotes" ("id");
CREATE UNIQUE INDEX "revenue_entries_code_key" ON "revenue_entries" ("code");
CREATE INDEX "revenue_entries_customer_active_idx" ON "revenue_entries" ("customer_id","occurred_at");
CREATE INDEX "revenue_entries_occurred_active_idx" ON "revenue_entries" ("occurred_at","business_type");
CREATE UNIQUE INDEX "revenue_entries_pkey" ON "revenue_entries" ("id");
CREATE INDEX "revenue_entries_project_active_idx" ON "revenue_entries" ("project_id","occurred_at");
CREATE UNIQUE INDEX "revenue_reductions_code_key" ON "revenue_reductions" ("code");
CREATE INDEX "revenue_reductions_occurred_active_idx" ON "revenue_reductions" ("occurred_at","type");
CREATE UNIQUE INDEX "revenue_reductions_pkey" ON "revenue_reductions" ("id");
CREATE UNIQUE INDEX "role_permissions_pkey" ON "role_permissions" ("role_id","permission_id");
CREATE UNIQUE INDEX "roles_name_key" ON "roles" ("name");
CREATE UNIQUE INDEX "roles_pkey" ON "roles" ("id");
CREATE UNIQUE INDEX "serial_numbers_pkey" ON "serial_numbers" ("id");
CREATE INDEX "serial_numbers_product_active_idx" ON "serial_numbers" ("product_id");
CREATE UNIQUE INDEX "serial_numbers_serial_key" ON "serial_numbers" ("serial");
CREATE INDEX "serial_numbers_warehouse_active_idx" ON "serial_numbers" ("warehouse_id");
CREATE INDEX "sessions_active_idx" ON "sessions" ("user_id","expires_at");
CREATE UNIQUE INDEX "sessions_pkey" ON "sessions" ("id");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions" ("token_hash");
CREATE UNIQUE INDEX "stock_move_lines_pkey" ON "stock_move_lines" ("id");
CREATE UNIQUE INDEX "stock_moves_code_key" ON "stock_moves" ("code");
CREATE INDEX "stock_moves_customer_active_idx" ON "stock_moves" ("customer_id");
CREATE UNIQUE INDEX "stock_moves_owner_request_id_unique" ON "stock_moves" ("owner_id","request_id");
CREATE UNIQUE INDEX "stock_moves_pkey" ON "stock_moves" ("id");
CREATE INDEX "stock_moves_project_active_idx" ON "stock_moves" ("project_id");
CREATE INDEX "stock_moves_supplier_active_idx" ON "stock_moves" ("supplier_id");
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers" ("code");
CREATE INDEX "suppliers_owner_active_idx" ON "suppliers" ("owner_id");
CREATE UNIQUE INDEX "suppliers_pkey" ON "suppliers" ("id");
CREATE INDEX "tasks_due_idx" ON "tasks" ("owner_id","status","due_at");
CREATE UNIQUE INDEX "tasks_pkey" ON "tasks" ("id");
CREATE UNIQUE INDEX "user_roles_pkey" ON "user_roles" ("user_id","role_id");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_pkey" ON "users" ("id");
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses" ("code");
CREATE UNIQUE INDEX "warehouses_pkey" ON "warehouses" ("id");
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "activities" ADD CONSTRAINT "activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id");
ALTER TABLE "activities" ADD CONSTRAINT "activities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "activities" ADD CONSTRAINT "activities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "deal_products" ADD CONSTRAINT "deal_products_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");
ALTER TABLE "deal_products" ADD CONSTRAINT "deal_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id");
ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "deals" ADD CONSTRAINT "deals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "deals" ADD CONSTRAINT "deals_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id");
ALTER TABLE "field_jobs" ADD CONSTRAINT "field_jobs_assigned_tech_user_id_fkey" FOREIGN KEY ("assigned_tech_user_id") REFERENCES "users"("id");
ALTER TABLE "field_jobs" ADD CONSTRAINT "field_jobs_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id");
ALTER TABLE "field_jobs" ADD CONSTRAINT "field_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "field_jobs" ADD CONSTRAINT "field_jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "field_jobs" ADD CONSTRAINT "field_jobs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");
ALTER TABLE "field_jobs" ADD CONSTRAINT "field_jobs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");
ALTER TABLE "field_jobs" ADD CONSTRAINT "field_jobs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "field_jobs" ADD CONSTRAINT "field_jobs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id");
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_inventory_count_id_fkey" FOREIGN KEY ("inventory_count_id") REFERENCES "inventory_counts"("id") ON DELETE CASCADE;
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id");
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_customer_fk" FOREIGN KEY ("converted_customer_id") REFERENCES "customers"("id");
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "leads" ADD CONSTRAINT "leads_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "login_audits" ADD CONSTRAINT "login_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id");
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "revenue_reductions" ADD CONSTRAINT "revenue_reductions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "revenue_reductions" ADD CONSTRAINT "revenue_reductions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "revenue_reductions" ADD CONSTRAINT "revenue_reductions_revenue_entry_id_fkey" FOREIGN KEY ("revenue_entry_id") REFERENCES "revenue_entries"("id");
ALTER TABLE "revenue_reductions" ADD CONSTRAINT "revenue_reductions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id");
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id");
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "stock_move_lines" ADD CONSTRAINT "stock_move_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "stock_move_lines" ADD CONSTRAINT "stock_move_lines_stock_move_id_fkey" FOREIGN KEY ("stock_move_id") REFERENCES "stock_moves"("id") ON DELETE CASCADE;
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_warehouse_from_id_fkey" FOREIGN KEY ("warehouse_from_id") REFERENCES "warehouses"("id");
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_warehouse_to_id_fkey" FOREIGN KEY ("warehouse_to_id") REFERENCES "warehouses"("id");
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_technician_id_fkey" FOREIGN KEY ("assigned_technician_id") REFERENCES "users"("id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id");
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");