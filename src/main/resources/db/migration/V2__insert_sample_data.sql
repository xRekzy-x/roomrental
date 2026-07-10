-- ==========================================
-- DỮ LIỆU MẪU: 26 PHÒNG (ROOM)
-- ==========================================
INSERT INTO room (room_number, area, price, status) VALUES
-- Tầng 1 (Trệt)
('101', 25.0, 3000000.00, 'AVAILABLE'),
('102', 25.0, 3000000.00, 'AVAILABLE'),
('103', 30.0, 3500000.00, 'AVAILABLE'),
('104', 30.0, 3500000.00, 'AVAILABLE'),
('105', 35.0, 4200000.00, 'AVAILABLE'),
-- Tầng 2
('201', 25.0, 3100000.00, 'AVAILABLE'),
('202', 25.0, 3100000.00, 'AVAILABLE'),
('203', 30.0, 3600000.00, 'AVAILABLE'),
('204', 30.0, 3600000.00, 'AVAILABLE'),
('205', 35.0, 4300000.00, 'AVAILABLE'),
-- Tầng 3
('301', 25.0, 3200000.00, 'AVAILABLE'),
('302', 25.0, 3200000.00, 'AVAILABLE'),
('303', 30.0, 3700000.00, 'AVAILABLE'),
('304', 30.0, 3700000.00, 'AVAILABLE'),
('305', 35.0, 4400000.00, 'AVAILABLE'),
-- Tầng 4
('401', 25.0, 3200000.00, 'AVAILABLE'),
('402', 25.0, 3200000.00, 'AVAILABLE'),
('403', 30.0, 3700000.00, 'AVAILABLE'),
('404', 30.0, 3700000.00, 'AVAILABLE'),
('405', 35.0, 4400000.00, 'AVAILABLE'),
-- Tầng 5
('501', 22.0, 2800000.00, 'AVAILABLE'),
('502', 22.0, 2800000.00, 'AVAILABLE'),
('503', 25.0, 3000000.00, 'AVAILABLE'),
('504', 25.0, 3000000.00, 'AVAILABLE'),
('505', 28.0, 3400000.00, 'AVAILABLE'),
('506', 28.0, 3400000.00, 'AVAILABLE');


-- ==========================================
-- DỮ LIỆU CHÈN THỬ NGHIỆM ĐỂ TEST TRIGGER
-- ==========================================

-- 1. Thêm 3 người thuê vào phòng 101 (Bạn không cần điền cột id)
INSERT INTO renter (full_name, cccd_number, phone, dob, room_number) VALUES
('Nguyen Van A', '012345678901', '0901234567', '1995-01-10', '101'), -- Sẽ nhận ID: 101-1
('Tran Thi B',   '012345678902', '0902345678', '1997-05-20', '101'), -- Sẽ nhận ID: 101-2
('Le Van C',     '012345678903', '0903456789', '1993-09-15', '101'); -- Sẽ nhận ID: 101-3

-- 2. Thêm 2 người thuê vào phòng 205
INSERT INTO renter (full_name, cccd_number, phone, dob, room_number) VALUES
('Pham Minh D',  '012345678904', '0904567890', '1996-12-01', '205'), -- Sẽ nhận ID: 205-1
('Hoang Thi E',  '012345678905', '0905678901', '1998-03-25', '205'); -- Sẽ nhận ID: 205-2

-- 3. Thêm phương tiện vào phòng 101
INSERT INTO vehicle (plate_number, vehicle_type, room_number) VALUES
('29A-11111', 'Yamaha Exciter', '101'), -- Sẽ nhận ID: 101-1
('29A-22222', 'Honda Vision',    '101'); -- Sẽ nhận ID: 101-2

-- 4. Thêm tài khoản liên kết với người thuê
INSERT INTO account (username, password, role, renter_id) VALUES
('nguyenvana', 'hash_password_123', 'RENTER', '101-1'),
('tranthib',   'hash_password_456', 'RENTER', '101-2');