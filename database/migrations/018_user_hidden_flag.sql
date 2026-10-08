-- Migration: 018_user_hidden_flag.sql
-- Thêm cờ is_hidden cho users để ẩn tài khoản kĩ thuật/dev khỏi danh sách nhân sự và phân công trong CRM

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Cập nhật ẩn các tài khoản kỹ thuật dev
UPDATE users
SET is_hidden = true
WHERE lower(email) IN ('dev@anviet.local', 'dev@gmail.com');
