package com.hung.roomrental.repository;

import com.hung.roomrental.entity.payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface paymentRepository extends JpaRepository<payment, Long> {
    // Tìm kiếm giao dịch dựa vào ID của SePay
    Optional<payment> findByTransactionId(String transactionId);
}