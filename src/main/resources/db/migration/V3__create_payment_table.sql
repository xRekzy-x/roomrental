CREATE TABLE payment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    billing_month VARCHAR(7) NOT NULL, -- Định dạng: 'YYYY-MM' (Ví dụ: '2026-07')
    payment_date DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'PAID',
    transaction_id VARCHAR(50) NOT NULL UNIQUE, -- Lưu ID giao dịch của SePay để tránh trùng lặp khi gửi lại
    CONSTRAINT fk_payment_room FOREIGN KEY (room_number) REFERENCES room(room_number)
);