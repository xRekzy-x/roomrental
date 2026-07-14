CREATE TABLE room (
    room_number VARCHAR(20) PRIMARY KEY,
    area DOUBLE,
    price DECIMAL(12,2) NOT NULL,
    current_renters INT DEFAULT 0,
    current_vehicles INT DEFAULT 0,
    renter_seq_counter INT DEFAULT 0, -- Cột đếm để sinh ID cho người thuê
    vehicle_seq_counter INT DEFAULT 0, -- Cột đếm để sinh ID cho phương tiện
    status VARCHAR(20) DEFAULT 'AVAILABLE'
);

CREATE TABLE renter (
    id VARCHAR(30) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    cccd_number VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(15) UNIQUE,
    dob DATE,
    room_number VARCHAR(20),
    CONSTRAINT fk_renter_room FOREIGN KEY (room_number) REFERENCES room(room_number)
);

CREATE TABLE vehicle (
    id VARCHAR(40) PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(20),
    room_number VARCHAR(20),
    CONSTRAINT fk_vehicle_room FOREIGN KEY (room_number) REFERENCES room(room_number)
);

CREATE TABLE account (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'ADMIN', 'RENTER'
    renter_id VARCHAR(30) NULL, -- liên kết tới renter nếu role = RENTER
    CONSTRAINT fk_account_renter FOREIGN KEY (renter_id) REFERENCES renter(id)
);

CREATE TABLE room_seq_pool (
    room_number VARCHAR(20),
    seq_no INT,
    PRIMARY KEY (room_number, seq_no),
    CONSTRAINT fk_pool_room_seq FOREIGN KEY (room_number) REFERENCES room(room_number) ON DELETE CASCADE
);

CREATE TABLE room_vehicle_pool (
    room_number VARCHAR(20),
    seq_no INT,
    PRIMARY KEY (room_number, seq_no),
    CONSTRAINT fk_pool_room_vehicle FOREIGN KEY (room_number) REFERENCES room(room_number) ON DELETE CASCADE
);

-- ==========================================
-- 2. TRIGGER TỰ ĐỘNG XỬ LÝ KHI THÊM (INSERT)
-- ==========================================

DELIMITER $$

-- Tự động sinh ID người thuê khi thêm mới
CREATE TRIGGER before_renter_insert
BEFORE INSERT ON renter
FOR EACH ROW
BEGIN
    DECLARE next_seq INT;

    SELECT MIN(seq_no) INTO next_seq
    FROM room_seq_pool
    WHERE room_number = NEW.room_number
    FOR UPDATE;
    IF next_seq IS NOT NULL THEN
        DELETE FROM room_seq_pool 
        WHERE room_number = NEW.room_number AND seq_no = next_seq;
        -- khong can cap nhat renter_seq_counter
    ELSE 
        SELECT renter_seq_counter + 1 INTO next_seq
        FROM room
        WHERE room_number = NEW.room_number
        FOR UPDATE;
        -- cap nhat lai renter_seq_counter
        UPDATE room 
        SET renter_seq_counter = next_seq
        WHERE room_number = NEW.room_number;

    END IF;
    UPDATE room 
    SET current_renters = current_renters + 1
    WHERE room_number = NEW.room_number;

    SET NEW.id = CONCAT(NEW.room_number, '-', next_seq);
END$$

-- Tự động sinh ID xe khi thêm mới
CREATE TRIGGER before_vehicle_insert
BEFORE INSERT ON vehicle
FOR EACH ROW
BEGIN
    DECLARE next_v_seq INT;
    SELECT MIN(seq_no) INTO next_v_seq
    FROM room_vehicle_pool
    WHERE room_number = NEW.room_number
    FOR UPDATE;

    IF next_v_seq IS NOT NULL THEN
        DELETE FROM room_vehicle_pool
        WHERE room_number = NEW.room_number AND seq_no = next_v_seq;
    ELSE
        SELECT vehicle_seq_counter + 1 INTO next_v_seq
        FROM room
        WHERE room_number = NEW.room_number
        FOR UPDATE;
        UPDATE room
        SET vehicle_seq_counter = next_v_seq
        WHERE room_number = NEW.room_number;
    END IF;

    UPDATE room 
    SET current_vehicles = current_vehicles + 1
    WHERE room_number = NEW.room_number;

    SET NEW.id = CONCAT(NEW.room_number, '-', next_v_seq);
END$$

-- ==========================================
-- 3. TRIGGER TỰ ĐỘNG XỬ LÝ KHI BỚT (DELETE)
-- ==========================================

-- Tự động trừ số người hiện tại trong phòng khi có người chuyển đi (bị xóa)
CREATE TRIGGER after_renter_delete
AFTER DELETE ON renter
FOR EACH ROW
BEGIN
    -- UPDATE room 
    -- SET renter_seq_counter = CAST(SUBSTRING_INDEX(renter_id, '-', -1) AS UNSIGNED)-1
    -- WHERE renter_id = OLD.id;
    INSERT INTO room_seq_pool (room_number, seq_no) 
    VALUES (OLD.room_number, CAST(SUBSTRING_INDEX(OLD.id, '-', -1) AS UNSIGNED));
    UPDATE room
    SET current_renters = GREATEST(0, current_renters - 1)
    WHERE room_number = OLD.room_number;
END$$

CREATE TRIGGER after_vehicle_delete
AFTER DELETE ON vehicle
FOR EACH ROW
BEGIN
    INSERT INTO room_vehicle_pool (room_number, seq_no)
    VALUES (OLD.room_number, CAST(SUBSTRING_INDEX(OLD.id, '-', -1) AS UNSIGNED));
    UPDATE room
    SET current_vehicles = GREATEST(0, current_vehicles -1)
    WHERE room_number = OLD.room_number;
END$$

CREATE TRIGGER after_renter_update
BEFORE UPDATE ON renter
FOR EACH ROW
BEGIN
    DECLARE next_seq INT;
    INSERT INTO room_seq_pool (room_number, seq_no) 
    VALUES (OLD.room_number, CAST(SUBSTRING_INDEX(OLD.id, '-', -1) AS UNSIGNED));
    SELECT MIN(seq_no) INTO next_seq
    FROM room_seq_pool
    WHERE room_number = NEW.room_number;

    IF next_seq IS NOT NULL THEN
        DELETE FROM room_seq_pool
        WHERE room_number = NEW.room_number AND seq_no = next_seq;
    ELSE
        SELECT renter_seq_counter + 1 INTO next_seq
        FROM room
        WHERE room_number = NEW.room_number
        FOR UPDATE;

        UPDATE room
        SET renter_seq_counter = next_seq
        WHERE room_number = NEW.room_number;

    END IF;

    -- DELETE FROM renter
    -- WHERE id = OLD.ID;

    UPDATE room
    SET current_renters = GREATEST(0, current_renters - 1)
    WHERE room_number = OLD.room_number;

    UPDATE room
    SET current_renters = current_renters + 1
    WHERE room_number = NEW.room_number;

    SET NEW.id = CONCAT(NEW.room_number, '-', next_seq);
END$$

CREATE TRIGGER after_vehicle_update
BEFORE UPDATE ON vehicle
FOR EACH ROW
BEGIN
    DECLARE next_v_seq INT;
    INSERT INTO room_vehicle_pool (room_number, seq_no)
    VALUES (OLD.room_number, CAST(SUBSTRING_INDEX(OLD.id, '-', -1) AS UNSIGNED));

    SELECT MIN(seq_no) INTO next_v_seq
    FROM room_vehicle_pool
    WHERE room_number = NEW.room_number;

    IF next_v_seq IS NOT NULL THEN
        DELETE FROM room_vehicle_pool
        WHERE room_number = NEW.room_number AND seq_no = next_v_seq;
    ELSE
        SELECT vehicle_seq_counter + 1 INTO next_v_seq
        FROM room
        WHERE room_number = NEW.room_number
        FOR UPDATE;

        UPDATE room
        SET vehicle_seq_counter = next_v_seq
        WHERE room_number = NEW.room_number;

    END IF;

    -- DELETE FROM vehicle
    -- WHERE id = OLD.ID;

    UPDATE room
    SET current_vehicles = GREATEST(0, current_vehicles - 1)
    WHERE room_number = OLD.room_number;

    UPDATE room
    SET current_vehicles = current_vehicles + 1
    WHERE room_number = NEW.room_number;

    SET NEW.id = CONCAT(NEW.room_number, '-', next_v_seq);
END$$


DELIMITER ;