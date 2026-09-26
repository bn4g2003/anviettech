-- Reclassify products into standard business categories
-- 1. Thiết bị điện chính: Camera, đầu ghi, mcc, chuông, bộ trung tâm báo giờ...
UPDATE products SET category = 'Thiết bị điện chính' WHERE sku IN (
  'camthanipvsc', 'camdomeipvsc', 'duan', 'h3c2mp', 'h3c3mp', 'h1c', 'c6n',
  'dg32k', '7616nxik1', 'mcckm', 'mcc', 'chuong', 'bott'
);

-- 2. Thiết bị lưu trữ: Ổ cứng, thẻ nhớ
UPDATE products SET category = 'Thiết bị lưu trữ' WHERE sku IN (
  'ocung20tb', 'o4tb', 'o2tb', 'o500', 'the128gb', 'the64gb'
);

-- 3. Vật tư: Switch chia mạng, switch POE, bộ quang điện...
UPDATE products SET category = 'Vật tư' WHERE sku IN (
  'sw5giga', 'swpoe4', 'swpoe8', 'quanglan', 'vtp'
);

-- 4. Phụ kiện: Dây dẫn, nguồn, giắc kết nối, hộp kỹ thuật...
UPDATE products SET category = 'Phụ kiện' WHERE sku IN (
  'daymang', 'daynguon', 'daythit', 'nguon12v2a', 'nguondaughi', 'phicham', 'bangdinh', 'hkt'
);

-- 5. Dịch vụ: Dịch vụ kỹ thuật & lắp đặt, nhân công
UPDATE products SET category = 'Dịch vụ' WHERE sku IN (
  'DV-CCTV', 'nc'
);
