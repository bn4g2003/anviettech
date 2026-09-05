-- Test-only rows. Loaded exclusively into anviet_reset_test_<uuid> databases.
INSERT INTO users(id, full_name, email, password_hash)
VALUES ('90000000-0000-0000-0000-000000000001', 'Reset test staff', 'staff@example.test', 'test-only');
INSERT INTO user_roles(user_id, role_id)
VALUES ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004');

INSERT INTO suppliers(id, code, name, owner_id, created_by)
VALUES ('90000000-0000-0000-0000-000000000002', 'RESET-SUP', 'Test supplier',
  '90000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001');
INSERT INTO projects(id, code, name, customer_id, owner_id, created_by)
VALUES ('90000000-0000-0000-0000-000000000003', 'RESET-PROJ', 'Test project',
  '00000000-0000-0000-0000-000000000030', '90000000-0000-0000-0000-000000000001',
  '90000000-0000-0000-0000-000000000001');
INSERT INTO product_suppliers(product_id, supplier_id, created_by)
VALUES ('00000000-0000-0000-0000-000000000060', '90000000-0000-0000-0000-000000000002',
  '90000000-0000-0000-0000-000000000001');
INSERT INTO serial_numbers(product_id, serial, warehouse_id, project_id, status)
VALUES ('00000000-0000-0000-0000-000000000060', 'RESET-SERIAL',
  '00000000-0000-0000-0000-000000000020', '90000000-0000-0000-0000-000000000003', 'damaged');
INSERT INTO inventory_counts(id, code, warehouse_id, owner_id)
VALUES ('90000000-0000-0000-0000-000000000004', 'RESET-COUNT',
  '00000000-0000-0000-0000-000000000020', '90000000-0000-0000-0000-000000000001');
INSERT INTO inventory_count_lines(inventory_count_id, product_id, expected_qty, counted_qty)
VALUES ('90000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000060', 25, 24);

INSERT INTO contracts(id, code, customer_id, quote_id, owner_id)
VALUES ('90000000-0000-0000-0000-000000000005', 'RESET-CONTRACT',
  '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000090',
  '90000000-0000-0000-0000-000000000001');
INSERT INTO orders(id, code, customer_id, contract_id, quote_id, owner_id)
VALUES ('90000000-0000-0000-0000-000000000006', 'RESET-ORDER',
  '00000000-0000-0000-0000-000000000030', '90000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000090', '90000000-0000-0000-0000-000000000001');
INSERT INTO order_lines(order_id, product_id, product_name, qty, unit_price, line_total)
VALUES ('90000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000060',
  'Test product', 1, 100, 100);
INSERT INTO stock_moves(id, code, type, warehouse_to_id, supplier_id, project_id, owner_id, request_id)
VALUES ('90000000-0000-0000-0000-000000000007', 'RESET-MOVE', 'in',
  '00000000-0000-0000-0000-000000000020', '90000000-0000-0000-0000-000000000002',
  '90000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000001', gen_random_uuid());
INSERT INTO stock_move_lines(stock_move_id, product_id, product_name, qty)
VALUES ('90000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000060', 'Test product', 1);
INSERT INTO invoices(id, code, customer_id, order_id, contract_id, amount, owner_id)
VALUES ('90000000-0000-0000-0000-000000000008', 'RESET-INVOICE',
  '00000000-0000-0000-0000-000000000030', '90000000-0000-0000-0000-000000000006',
  '90000000-0000-0000-0000-000000000005', 110, '90000000-0000-0000-0000-000000000001');
INSERT INTO payments(code, invoice_id, customer_id, amount, method, paid_at, owner_id)
VALUES ('RESET-PAYMENT', '90000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000030', 50, 'cash', now(), '90000000-0000-0000-0000-000000000001');
INSERT INTO revenue_entries(id, code, customer_id, project_id, product_id, employee_id, invoice_id,
  qty, unit_price, subtotal, vat_amount, total_amount, paid_amount)
VALUES ('90000000-0000-0000-0000-000000000009', 'RESET-REVENUE',
  '00000000-0000-0000-0000-000000000030', '90000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000060', '90000000-0000-0000-0000-000000000001',
  '90000000-0000-0000-0000-000000000008', 1, 100, 100, 10, 110, 50);
INSERT INTO revenue_reductions(code, customer_id, revenue_entry_id, type, amount, created_by)
VALUES ('RESET-REDUCTION', '00000000-0000-0000-0000-000000000030',
  '90000000-0000-0000-0000-000000000009', 'discount', 10, '90000000-0000-0000-0000-000000000001');
INSERT INTO operating_expenses(code, amount, created_by)
VALUES ('RESET-EXPENSE', 5, '90000000-0000-0000-0000-000000000001');
INSERT INTO documents(entity_type, entity_id, original_name, storage_key, mime_type, size_bytes, uploaded_by)
VALUES ('customer', '00000000-0000-0000-0000-000000000030', 'test.txt', 'reset-test.txt',
  'text/plain', 1, '90000000-0000-0000-0000-000000000001');
INSERT INTO sessions(user_id, token_hash, expires_at)
VALUES ('90000000-0000-0000-0000-000000000001', repeat('a', 64), now() + interval '1 day');
INSERT INTO login_audits(email, user_id, succeeded)
VALUES ('staff@example.test', '90000000-0000-0000-0000-000000000001', true);
INSERT INTO audit_logs(actor_id, module, action, entity_type)
VALUES ('90000000-0000-0000-0000-000000000001', 'customers', 'create', 'customer');
