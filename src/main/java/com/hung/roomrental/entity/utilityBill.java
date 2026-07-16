package com.hung.roomrental.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "utility_bill")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class utilityBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @Column(name = "billing_month", nullable = false, length = 7)
    private String billingMonth;

    @Column(name = "old_electricity")
    private Integer oldElectricity;

    @Column(name = "new_electricity")
    private Integer newElectricity;

    @Column(name = "electricity_fee", nullable = false)
    private BigDecimal electricityFee; // Đơn giá điện (mặc định: 3500.00)

    @Column(name = "water_fee", nullable = false)
    private BigDecimal waterFee; // Tiền nước khoán cố định (mặc định: 15000.00)

    @Column(name = "internet_fee", nullable = false)
    private BigDecimal internetFee;

    @Column(name = "washing_machine_fee", nullable = false)
    private BigDecimal washingMachineFee;

    @Column(name = "other_fee")
    private BigDecimal otherFee;

    @Column(name = "room_price", nullable = false)
    private BigDecimal roomPrice;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @PrePersist
    @PreUpdate
    public void calculateTotalAmount() {
        int oldElec = oldElectricity != null ? oldElectricity : 0;
        int newElec = newElectricity != null ? newElectricity : 0;
        
        // Tính tiền điện dựa trên lượng tiêu thụ và đơn giá điện
        BigDecimal elecUsage = BigDecimal.valueOf(Math.max(0, newElec - oldElec));
        BigDecimal elecCost = elecUsage.multiply(electricityFee != null ? electricityFee : BigDecimal.ZERO);

        BigDecimal water = waterFee != null ? waterFee : BigDecimal.ZERO;
        BigDecimal rent = roomPrice != null ? roomPrice : BigDecimal.ZERO;
        BigDecimal internet = internetFee != null ? internetFee : BigDecimal.ZERO;
        BigDecimal wash = washingMachineFee != null ? washingMachineFee : BigDecimal.ZERO;
        BigDecimal other = otherFee != null ? otherFee : BigDecimal.ZERO;

        // Tổng tiền của tháng = Tiền phòng + Tiền điện + Tiền nước khoán + Internet + Máy giặt + Khác
        this.totalAmount = rent.add(elecCost).add(water).add(internet).add(wash).add(other);
    }
}