package com.hung.roomrental.dto;

import lombok.Data;
import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class sepayWebhookRequest {
    private Long id;                // ID giao dịch duy nhất của SePay
    private String gateway;         // Cổng thanh toán (Ví dụ: OCB)
    private String transactionDate; // Ngày giao dịch dạng chuỗi "YYYY-MM-DD HH:mm:ss"
    private BigDecimal transferAmount;      // Số tiền giao dịch
    private String content;         // Nội dung chuyển khoản thô
    private String subAccount;      // Số tài khoản ảo nhận tiền (Nếu có)
    private String referenceCode;   // Mã tham chiếu của Ngân hàng
}