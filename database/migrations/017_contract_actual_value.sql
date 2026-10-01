-- 017_contract_actual_value.sql
-- Thêm trường giá trị thực tế (quyết toán / nghiệm thu) cho hợp đồng

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS actual_value numeric(18,2);
