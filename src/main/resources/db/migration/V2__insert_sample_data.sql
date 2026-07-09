-- 1. Nạp dữ liệu mẫu cho bảng Phòng (room)
-- Gồm các trạng thái: AVAILABLE (Còn trống), OCCUPIED (Đã thuê), MAINTENANCE (Bảo trì)
INSERT INTO room (room_number, area, price, current_renters, status) VALUES 
('101', 25.5, 3500000.00, 1, 'OCCUPIED'),
('102', 25.5, 3500000.00, 0, 'AVAILABLE'),
('201', 30.0, 4200000.00, 2, 'OCCUPIED'),
('202', 30.0, 4200000.00, 0, 'AVAILABLE'),
('301', 35.0, 5000000.00, 0, 'MAINTENANCE');

-- 2. Nạp dữ liệu mẫu cho bảng Khách thuê (renter)
-- Liên kết các khách thuê vào các phòng đã tạo ở trên (ID 1 và ID 3)
INSERT INTO renter (full_name, cccd_number, phone, dob, room_id) VALUES 
('Nguyễn Văn Sơn', '037201008899', '0912345678', '1995-05-15', 1),
('Trần Thị Thảo', '037201004455', '0987654321', '1998-09-20', 3),
('Phạm Minh Đức', '037201001122', '0901234567', '1997-12-10', 3);

-- 3. Nạp dữ liệu mẫu cho bảng Phương tiện (vehicle)
-- Liên kết phương tiện với khách thuê thông qua renter_id (1: Sơn, 2: Thảo)
INSERT INTO vehicle (plate_number, vehicle_type, renter_id) VALUES 
('29A-12345', 'Xe máy (Vision)', 1),
('30K-99999', 'Xe máy (Exciter)', 2),
('17H-55555', 'Xe máy (Wave Alpha)', 3);

-- 4. Nạp dữ liệu mẫu cho bảng Tài khoản (account)
-- Lưu ý: Mật khẩu dưới đây để ở dạng văn bản thuần (plain text) để bạn dễ kiểm thử. 
-- Nếu sau này bạn tích hợp Spring Security, bạn sẽ cần mã hóa chúng (ví dụ bằng BCrypt).
INSERT INTO account (username, password, role, renter_id) VALUES 
('admin', 'admin123', 'ADMIN', NULL),
( 'vanson', 'user123', 'RENTER', 1),
('thithao', 'user123', 'RENTER', 2);