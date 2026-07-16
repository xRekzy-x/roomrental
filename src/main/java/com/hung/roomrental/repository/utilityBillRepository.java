package com.hung.roomrental.repository;

import com.hung.roomrental.entity.utilityBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface utilityBillRepository extends JpaRepository<utilityBill, Long> {
    Optional<utilityBill> findByRoomNumberAndBillingMonth(String roomNumber, String billingMonth);
    List<utilityBill> findByBillingMonth(String billingMonth);
}