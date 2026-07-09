CREATE TABLE room (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    area DOUBLE,
    price DECIMAL(12,2) NOT NULL,
    current_renters INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'AVAILABLE'
);

CREATE TABLE renter (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    cccd_number VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(15),
    dob DATE,
    room_id BIGINT,
    CONSTRAINT fk_tenant_room FOREIGN KEY (room_id) REFERENCES room(id)
);

CREATE TABLE vehicle (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(20),
    renter_id BIGINT NOT NULL,
    CONSTRAINT fk_vehicle_renter FOREIGN KEY (renter_id) REFERENCES renter(id)
);

CREATE TABLE account (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'ADMIN', 'RENTER'
    renter_id BIGINT NULL, -- liên kết tới renter nếu role = RENTER
    CONSTRAINT fk_account_renter FOREIGN KEY (renter_id) REFERENCES renter(id)
);