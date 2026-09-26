-- 016_campaign_content_and_landing_url.sql
-- Thêm nội dung chiến dịch và link trang chạy quảng cáo
-- Thu hồi quyền analytics (Phân tích HĐKD) khỏi vai trò Marketing

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS landing_page_url text;

-- Xóa quyền xem/thao tác phân tích HĐKD khỏi vai trò Marketing
DELETE FROM role_permissions
WHERE role_id = '00000000-0000-0000-0000-000000000005'
  AND permission_id IN (SELECT id FROM permissions WHERE module = 'analytics');
