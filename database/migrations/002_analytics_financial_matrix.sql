-- Migration 002: Financial Matrix Analytics & Operating Expenses & Field Work Tasks

-- 1. Extend products with cost_price and business_type
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric(18,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_type varchar(50) NOT NULL DEFAULT 'new_construction';

-- 2. Extend orders & order_lines with business_type and cost_price
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type varchar(50) NOT NULL DEFAULT 'new_construction';
ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS cost_price numeric(18,2) NOT NULL DEFAULT 0;
ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS business_type varchar(50) NOT NULL DEFAULT 'new_construction';

-- 3. Extend invoices with business_type
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_type varchar(50) NOT NULL DEFAULT 'new_construction';

-- 4. Extend tasks with technical assignment & field work fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_type varchar(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS site_address text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_technician_id uuid REFERENCES users(id);

-- 5. Align operating_expenses table columns
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

-- Ensure code is optional if it was NOT NULL
ALTER TABLE operating_expenses ALTER COLUMN code DROP NOT NULL;
ALTER TABLE operating_expenses ADD COLUMN IF NOT EXISTS period_date date;
ALTER TABLE operating_expenses ADD COLUMN IF NOT EXISTS category varchar(64);
ALTER TABLE operating_expenses ADD COLUMN IF NOT EXISTS notes text;

-- Index for analytics querying
CREATE INDEX IF NOT EXISTS operating_expenses_date_idx ON operating_expenses(expense_date, expense_category) WHERE deleted_at IS NULL;

-- 6. Seed sample Operating Expenses for 2025 & 2026 if table is empty
DO $$
DECLARE
  curr_date DATE;
  admin_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operating_expenses WHERE deleted_at IS NULL LIMIT 1) THEN
    SELECT id INTO admin_id FROM users WHERE status='active' ORDER BY created_at ASC LIMIT 1;
    
    FOR y IN 2025..2026 LOOP
      FOR m IN 1..12 LOOP
        curr_date := (y || '-' || LPAD(m::text, 2, '0') || '-05')::DATE;
        
        -- Salary (Chi phi tiền lương)
        INSERT INTO operating_expenses (code, expense_category, category, amount, expense_date, period_date, description, notes, created_by)
        VALUES ('CP-' || y || '-' || LPAD(m::text, 2, '0') || '-01', 'salary', 'salary', 120000000 + (m * 2500000) + (y - 2025) * 10000000, curr_date, curr_date, 'Lương nhân sự tháng ' || m || '/' || y, 'Lương nhân sự tháng ' || m || '/' || y, admin_id);
        
        -- Insurance (Chi trả bảo hiểm)
        INSERT INTO operating_expenses (code, expense_category, category, amount, expense_date, period_date, description, notes, created_by)
        VALUES ('CP-' || y || '-' || LPAD(m::text, 2, '0') || '-02', 'insurance', 'insurance', 16000000 + (m * 300000), curr_date, curr_date, 'Bảo hiểm XH-YT tháng ' || m || '/' || y, 'Bảo hiểm XH-YT tháng ' || m || '/' || y, admin_id);
        
        -- Rent (Chi phí thuê văn phòng)
        INSERT INTO operating_expenses (code, expense_category, category, amount, expense_date, period_date, description, notes, created_by)
        VALUES ('CP-' || y || '-' || LPAD(m::text, 2, '0') || '-03', 'office_rent', 'office_rent', 35000000, curr_date, curr_date, 'Tiền thuê VP & Kho tháng ' || m || '/' || y, 'Tiền thuê VP & Kho tháng ' || m || '/' || y, admin_id);
        
        -- Tax (Chi phí thuế)
        INSERT INTO operating_expenses (code, expense_category, category, amount, expense_date, period_date, description, notes, created_by)
        VALUES ('CP-' || y || '-' || LPAD(m::text, 2, '0') || '-04', 'tax', 'tax', 8000000 + (m * 800000), curr_date, curr_date, 'Thuế GTGT/TNDN tạm tính ' || m || '/' || y, 'Thuế GTGT/TNDN tạm tính ' || m || '/' || y, admin_id);
        
        -- Admin / Management (Chi phí quản lý DN)
        INSERT INTO operating_expenses (code, expense_category, category, amount, expense_date, period_date, description, notes, created_by)
        VALUES ('CP-' || y || '-' || LPAD(m::text, 2, '0') || '-05', 'admin', 'management', 12000000 + (m * 700000), curr_date, curr_date, 'Chi phí quản lý & vận hành ' || m || '/' || y, 'Chi phí quản lý & vận hành ' || m || '/' || y, admin_id);
        
        -- Tech Dept (Chi phí dùng cho phòng KT)
        INSERT INTO operating_expenses (code, expense_category, category, amount, expense_date, period_date, description, notes, created_by)
        VALUES ('CP-' || y || '-' || LPAD(m::text, 2, '0') || '-06', 'tech_dept', 'tech_dept', 15000000 + (m * 1200000), curr_date, curr_date, 'Chi phí trang thiết bị & công cụ kỹ thuật ' || m || '/' || y, 'Chi phí trang thiết bị & công cụ kỹ thuật ' || m || '/' || y, admin_id);
        
        -- Other (Chi phí Khác)
        INSERT INTO operating_expenses (code, expense_category, category, amount, expense_date, period_date, description, notes, created_by)
        VALUES ('CP-' || y || '-' || LPAD(m::text, 2, '0') || '-07', 'other', 'other', 5000000 + (m * 500000), curr_date, curr_date, 'Chi phí đi lại & tiếp khách ' || m || '/' || y, 'Chi phí đi lại & tiếp khách ' || m || '/' || y, admin_id);
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- 7. Ensure existing products have cost_price and business_type updated if zero/default
UPDATE products SET cost_price = unit_price * 0.65 WHERE cost_price = 0;
UPDATE products SET business_type = CASE 
  WHEN category ILIKE '%thi công%' OR category ILIKE '%lắp đặt%' OR category ILIKE '%dự án%' THEN 'new_construction'
  WHEN category ILIKE '%sửa chữa%' OR category ILIKE '%bảo trì%' THEN 'repair'
  WHEN category ILIKE '%bảo hành%' OR category ILIKE '%linh kiện%' THEN 'warranty'
  ELSE 'retail'
END WHERE business_type = 'new_construction';

-- 8. Seed sample Orders & Invoices across 2025/2026 by Business Type if needed
DO $$
DECLARE
  cust_id UUID;
  user_id UUID;
  prod_id UUID;
  ord_id UUID;
  order_cnt INT;
  base_val NUMERIC;
BEGIN
  SELECT count(*) INTO order_cnt FROM orders WHERE code LIKE 'DH-%-2025-%';
  IF order_cnt = 0 THEN
    SELECT id INTO cust_id FROM customers WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO user_id FROM users WHERE status='active' LIMIT 1;
    SELECT id INTO prod_id FROM products WHERE deleted_at IS NULL LIMIT 1;

    FOR y IN 2025..2026 LOOP
      FOR m IN 1..12 LOOP
        -- 1. Thi công công trình mới (New Construction)
        base_val := 250000000 + (m * 15000000) + random() * 50000000;
        INSERT INTO orders(code, customer_id, status, owner_id, total, business_type, created_at)
        VALUES ('DH-TC-' || y || '-' || LPAD(m::text, 2, '0'), cust_id, 'fulfilled', user_id, base_val, 'new_construction', (y || '-' || LPAD(m::text, 2, '0') || '-10')::TIMESTAMPTZ)
        RETURNING id INTO ord_id;
        
        IF prod_id IS NOT NULL THEN
          INSERT INTO order_lines(order_id, product_id, product_name, qty, unit_price, cost_price, line_total, business_type)
          VALUES (ord_id, prod_id, 'Gói thi công hệ thống công trình', 1, base_val, base_val * 0.65, base_val, 'new_construction');
        END IF;

        INSERT INTO invoices(code, customer_id, order_id, status, amount, paid_amount, due_date, owner_id, business_type, created_at)
        VALUES ('HD-TC-' || y || '-' || LPAD(m::text, 2, '0'), cust_id, ord_id, 'paid', base_val, base_val, (y || '-' || LPAD(m::text, 2, '0') || '-28')::DATE, user_id, 'new_construction', (y || '-' || LPAD(m::text, 2, '0') || '-10')::TIMESTAMPTZ);

        -- 2. Sửa chữa (Repair)
        base_val := 45000000 + (m * 4000000) + random() * 10000000;
        INSERT INTO orders(code, customer_id, status, owner_id, total, business_type, created_at)
        VALUES ('DH-SC-' || y || '-' || LPAD(m::text, 2, '0'), cust_id, 'fulfilled', user_id, base_val, 'repair', (y || '-' || LPAD(m::text, 2, '0') || '-12')::TIMESTAMPTZ)
        RETURNING id INTO ord_id;

        IF prod_id IS NOT NULL THEN
          INSERT INTO order_lines(order_id, product_id, product_name, qty, unit_price, cost_price, line_total, business_type)
          VALUES (ord_id, prod_id, 'Dịch vụ sửa chữa thay thế linh kiện', 1, base_val, base_val * 0.55, base_val, 'repair');
        END IF;

        INSERT INTO invoices(code, customer_id, order_id, status, amount, paid_amount, due_date, owner_id, business_type, created_at)
        VALUES ('HD-SC-' || y || '-' || LPAD(m::text, 2, '0'), cust_id, ord_id, 'paid', base_val, base_val, (y || '-' || LPAD(m::text, 2, '0') || '-28')::DATE, user_id, 'repair', (y || '-' || LPAD(m::text, 2, '0') || '-12')::TIMESTAMPTZ);

        -- 3. Bảo hành (Warranty)
        base_val := 18000000 + (m * 2000000) + random() * 5000000;
        INSERT INTO orders(code, customer_id, status, owner_id, total, business_type, created_at)
        VALUES ('DH-BH-' || y || '-' || LPAD(m::text, 2, '0'), cust_id, 'fulfilled', user_id, base_val, 'warranty', (y || '-' || LPAD(m::text, 2, '0') || '-15')::TIMESTAMPTZ)
        RETURNING id INTO ord_id;

        IF prod_id IS NOT NULL THEN
          INSERT INTO order_lines(order_id, product_id, product_name, qty, unit_price, cost_price, line_total, business_type)
          VALUES (ord_id, prod_id, 'Gói dịch vụ bảo hành mở rộng', 1, base_val, base_val * 0.40, base_val, 'warranty');
        END IF;

        INSERT INTO invoices(code, customer_id, order_id, status, amount, paid_amount, due_date, owner_id, business_type, created_at)
        VALUES ('HD-BH-' || y || '-' || LPAD(m::text, 2, '0'), cust_id, ord_id, 'paid', base_val, base_val, (y || '-' || LPAD(m::text, 2, '0') || '-28')::DATE, user_id, 'warranty', (y || '-' || LPAD(m::text, 2, '0') || '-15')::TIMESTAMPTZ);

        -- 4. Bán buôn, bán lẻ (Retail)
        base_val := 85000000 + (m * 6000000) + random() * 20000000;
        INSERT INTO orders(code, customer_id, status, owner_id, total, business_type, created_at)
        VALUES ('DH-BL-' || y || '-' || LPAD(m::text, 2, '0'), cust_id, 'fulfilled', user_id, base_val, 'retail', (y || '-' || LPAD(m::text, 2, '0') || '-18')::TIMESTAMPTZ)
        RETURNING id INTO ord_id;

        IF prod_id IS NOT NULL THEN
          INSERT INTO order_lines(order_id, product_id, product_name, qty, unit_price, cost_price, line_total, business_type)
          VALUES (ord_id, prod_id, 'Bán thiết bị & vật tư bán lẻ', 1, base_val, base_val * 0.70, base_val, 'retail');
        END IF;

        INSERT INTO invoices(code, customer_id, order_id, status, amount, paid_amount, due_date, owner_id, business_type, created_at)
        VALUES ('HD-BL-' || y || '-' || LPAD(m::text, 2, '0'), cust_id, ord_id, 'paid', base_val, base_val, (y || '-' || LPAD(m::text, 2, '0') || '-28')::DATE, user_id, 'retail', (y || '-' || LPAD(m::text, 2, '0') || '-18')::TIMESTAMPTZ);
      END LOOP;
    END LOOP;
  END IF;
END $$;
