-- Migration 019: Mo rong truong product_name trong order_lines de chua mo ta dich vu chi tiet tu CCTV
ALTER TABLE order_lines ALTER COLUMN product_name TYPE text;
