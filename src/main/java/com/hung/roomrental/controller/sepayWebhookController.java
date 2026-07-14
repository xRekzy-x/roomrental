package com.hung.roomrental.controller;

import com.hung.roomrental.dto.sepayWebhookRequest;
import com.hung.roomrental.entity.payment;
import com.hung.roomrental.repository.paymentRepository;
import com.hung.roomrental.repository.roomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/payments")
public class sepayWebhookController {

    @GetMapping
    public List<payment> getAllPayments() {
        // Trả về danh sách tất cả các giao dịch thanh toán, xếp mới nhất lên đầu
        return paymentRepo.findAll();
    }

    @Autowired
    private roomRepository roomRepo;

    @Autowired
    private paymentRepository paymentRepo;

    // Mã bảo mật tự chọn khớp với cấu hình trên SePay Dashboard
    private final String API_KEY = "api_go_dau_hung_fabulous";

    @PostMapping("/sepay-webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody sepayWebhookRequest request) {

        System.out.println(">>> Nhận Webhook SePay cho ID giao dịch: " + request.getId());

        // 1. Xác thực bảo mật API Key
        if (authHeader == null || !authHeader.contains(API_KEY)) {
            System.out.println("❌ Cảnh báo: Yêu cầu Webhook không chứa API Key hợp lệ.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("API Key không hợp lệ");
        }

        try {
            // 2. Kiểm tra trùng lặp giao dịch
            String sepayTxId = String.valueOf(request.getId());
            if (paymentRepo.findByTransactionId(sepayTxId).isPresent()) {
                System.out.println("⚠️ Giao dịch " + sepayTxId + " đã được ghi nhận trước đó. Bỏ qua.");
                return ResponseEntity.ok("Giao dịch đã tồn tại");
            }

            // 3. Quét tìm số phòng 3 chữ số hợp lệ từ dữ liệu nhận về
            String roomNumber = null;

            // Bước 3.2: Nếu tài khoản ảo không có, quét tiếp trong nội dung chuyển khoản thô (content)
            if (roomNumber == null || roomNumber.isBlank()) {
                roomNumber = scanValidRoomNumber(request.getContent());
            }

            // 4. Nếu phát hiện số phòng hợp lệ và có trong Database
            if (roomNumber != null) {
                // Định dạng ngày giờ giao dịch nhận được từ SePay
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                LocalDateTime paymentDateTime = LocalDateTime.parse(request.getTransactionDate(), formatter);
                
                // Định dạng tháng xuất hóa đơn (Ví dụ: '2026-07')
                String billingMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

                // 5. Ghi nhận hóa đơn vào DB
                payment newPayment = payment.builder()
                        .roomNumber(roomNumber)
                        .amount(request.getAmount())
                        .billingMonth(billingMonth)
                        .paymentDate(paymentDateTime)
                        .status("PAID")
                        .transactionId(sepayTxId)
                        .build();

                paymentRepo.save(newPayment);

                System.out.println("✅ Tự động xác nhận thanh toán thành công " + request.getAmount() + "đ cho phòng: " + roomNumber);
                return ResponseEntity.ok("Xử lý thành công");
            } else {
                System.out.println("❌ Không tìm thấy bất kỳ số phòng 3 chữ số nào hợp lệ trong dữ liệu giao dịch: subAccount=" 
                        + request.getSubAccount() + ", content=" + request.getContent());
            }

        } catch (Exception e) {
            System.err.println("❌ Lỗi hệ thống khi xử lý Webhook: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi máy chủ nội bộ");
        }

        return ResponseEntity.ok("Nhận thông tin thành công nhưng không tìm thấy mã phòng khớp trong hệ thống.");
    }

    /**
     * Hàm quét thông minh: Tìm tất cả các cụm có đúng 3 chữ số liên tiếp trong chuỗi.
     * Đối chiếu từng cụm với Database, nếu cụm nào tồn tại trong DB thì lấy làm số phòng ngay lập tức.
     */
    private String scanValidRoomNumber(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }

        // Biểu thức chính quy quét tìm các cụm có đúng 3 chữ số liên tiếp
        Pattern pattern = Pattern.compile("\\d{3}");
        Matcher matcher = pattern.matcher(text);

        // Duyệt qua tất cả các cụm 3 số tìm thấy được từ trái qua phải
        while (matcher.find()) {
            String candidate = matcher.group(); // Ví dụ: lấy ra "999", hoặc "101"
            
            // Đối chiếu trực tiếp với database thông qua repository
            if (roomRepo.existsById(candidate)) {
                System.out.println("🔍 Phát hiện số phòng hợp lệ từ chuỗi: " + candidate);
                return candidate; // Tìm thấy phòng hợp lệ đầu tiên -> Trả về ngay lập tức để dừng quét
            } else {
                System.out.println("🔍 Phát hiện cụm 3 số '" + candidate + "' nhưng số phòng này không tồn tại trong DB, tiếp tục tìm...");
            }
        }

        return null; // Không tìm thấy phòng nào hợp lệ
    }
}