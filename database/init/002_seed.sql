INSERT INTO roles (id, name, description, is_system) VALUES
 ('00000000-0000-0000-0000-000000000001','Super admin','Toàn quyền hệ thống',true),
 ('00000000-0000-0000-0000-000000000002','Admin','Quản trị vận hành',true),
 ('00000000-0000-0000-0000-000000000003','Trưởng kinh doanh','Quản lý kinh doanh',true),
 ('00000000-0000-0000-0000-000000000004','Nhân viên kinh doanh','Quản lý dữ liệu của mình',true),
 ('00000000-0000-0000-0000-000000000005','Marketing','Quản lý marketing',true),
 ('00000000-0000-0000-0000-000000000006','Kho','Quản lý kho',true),
 ('00000000-0000-0000-0000-000000000007','Kế toán','Quản lý tài chính',true),
 ('00000000-0000-0000-0000-000000000008','Chỉ xem','Chỉ xem dữ liệu',true);

INSERT INTO permissions(module, action, scope)
SELECT module, action, scope FROM unnest(ARRAY['*','users','roles','leads','customers','contacts','activities','tasks','products','deals','quotes','contracts','orders','inventory','finance','campaigns','analytics','documents']) module
CROSS JOIN unnest(ARRAY['view','create','update','delete','approve','export']) action
CROSS JOIN unnest(ARRAY['all'::record_scope,'own'::record_scope]) scope;

-- Super admin: all
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions;

-- Admin: all modules with scope all (except * wildcards only for super)
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
WHERE module <> '*' AND scope = 'all';

-- Trưởng kinh doanh: CRM + sales all
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
WHERE module IN ('leads','customers','contacts','activities','tasks','deals','quotes','contracts','orders','products','campaigns','analytics','documents') AND scope = 'all';

-- NVKD: own scope for CRM/sales, view products/analytics all
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE module IN ('leads','customers','contacts','activities','tasks','deals','quotes','contracts','orders','documents') AND scope = 'own';
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE module IN ('products','analytics') AND action = 'view' AND scope = 'all';

-- Marketing
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM permissions
WHERE module IN ('campaigns','leads','customers','analytics','documents') AND scope = 'all';

-- Kho
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000006', id FROM permissions
WHERE module IN ('products','inventory','orders') AND scope = 'all';

-- Kế toán
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000007', id FROM permissions
WHERE module IN ('finance','orders','contracts','quotes','customers','analytics') AND scope = 'all';

-- Viewer: view all
INSERT INTO role_permissions(role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000008', id FROM permissions
WHERE action = 'view' AND scope = 'all' AND module <> '*';

-- Admin@123
INSERT INTO users (id, full_name, email, password_hash, must_change_password) VALUES
 ('00000000-0000-0000-0000-000000000010','Quản trị AnViet','admin@anviet.local','$argon2id$v=19$m=65536,p=4,t=3$ZGCYoyqcpTEHnZhM9dqmGA$kUg0U3+R/LN3IaPq6Xh9m7sc/iOy33yCyC1aUWA1nG0',true);
INSERT INTO user_roles(user_id, role_id) VALUES ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001');

INSERT INTO warehouses(id, code, name, is_default) VALUES
 ('00000000-0000-0000-0000-000000000020','KHO-001','Kho trung tâm',true);

INSERT INTO campaigns(id, code, name, channel, status, budget, spent, start_date, end_date, owner_id, created_by, updated_by) VALUES
 ('00000000-0000-0000-0000-000000000040','KM-0001','Chiến dịch Q1','online','running',50000000,12000000,CURRENT_DATE - 30,CURRENT_DATE + 60,'00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO customers(id, code, name, type, status, email, phone, address, source, owner_id, campaign_id, created_by, updated_by) VALUES
 ('00000000-0000-0000-0000-000000000030','KH-0001','Công ty Cơ điện Minh Phát','company','active','contact@minhphat.vn','0901000001','Hà Nội','Seed','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO contacts(customer_id, full_name, email, phone, is_primary, job_title, created_by, updated_by) VALUES
 ('00000000-0000-0000-0000-000000000030','An Phạm','an@minhphat.vn','0901000011',true,'Giám đốc','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO leads(id, code, name, company_name, email, phone, source, status, owner_id, campaign_id, notes, created_by, updated_by) VALUES
 ('00000000-0000-0000-0000-000000000050','TN-0001','Nguyễn Văn Hùng','Công ty ABC Tech','hung@abctech.vn','0902000001','Website','qualified','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000040','Lead mẫu sẵn sàng chuyển đổi','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010'),
 ('00000000-0000-0000-0000-000000000051','TN-0002','Trần Thị Mai','Nhà máy XYZ','mai@xyz.vn','0902000002','Referral','new','00000000-0000-0000-0000-000000000010',NULL,'Lead mới','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO products(id, sku, name, category, unit, unit_price, vat_percent, min_stock, status, created_by, updated_by) VALUES
 ('00000000-0000-0000-0000-000000000060','SP-INV-001','Biến tần 15kW','Biến tần','bộ',18500000,10,2,'active','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010'),
 ('00000000-0000-0000-0000-000000000061','SP-MTR-002','Động cơ 7.5kW','Động cơ','cái',9200000,10,5,'active','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010'),
 ('00000000-0000-0000-0000-000000000062','SP-CBL-003','Cáp điều khiển 100m','Cáp','cuộn',3500000,8,10,'active','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO inventory_balances(warehouse_id, product_id, qty) VALUES
 ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000060',25),
 ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000061',40),
 ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000062',80);

INSERT INTO deals(id, code, title, customer_id, stage, value, probability, expected_close_date, owner_id, created_by, updated_by) VALUES
 ('00000000-0000-0000-0000-000000000070','CH-0001','Gói biến tần nhà máy Minh Phát','00000000-0000-0000-0000-000000000030','negotiation',55000000,60,CURRENT_DATE + 20,'00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO deal_products(deal_id, product_id) VALUES
 ('00000000-0000-0000-0000-000000000070','00000000-0000-0000-0000-000000000060'),
 ('00000000-0000-0000-0000-000000000070','00000000-0000-0000-0000-000000000061');

INSERT INTO tasks(id, title, type, status, due_at, owner_id, customer_id, deal_id, created_by, updated_by) VALUES
 ('00000000-0000-0000-0000-000000000080','Gọi follow-up báo giá','call','open',now() + interval '2 days','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000070','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO activities(type, subject, content, owner_id, customer_id, deal_id, created_by, updated_by) VALUES
 ('note','Ghi chú lần gặp','Khách quan tâm gói biến tần 15kW','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000070','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO quotes(id, code, customer_id, deal_id, status, valid_until, owner_id, terms, subtotal, total, created_by, updated_by) VALUES
 ('00000000-0000-0000-0000-000000000090','BG-0001','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000070','sent',CURRENT_DATE + 15,'00000000-0000-0000-0000-000000000010','Thanh toán 30 ngày',27700000,30250000,'00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010');

INSERT INTO quote_lines(quote_id, product_id, product_name, qty, unit_price, discount_percent, vat_percent, line_total) VALUES
 ('00000000-0000-0000-0000-000000000090','00000000-0000-0000-0000-000000000060','Biến tần 15kW',1,18500000,0,10,20350000),
 ('00000000-0000-0000-0000-000000000090','00000000-0000-0000-0000-000000000061','Động cơ 7.5kW',1,9200000,0,10,10120000);
