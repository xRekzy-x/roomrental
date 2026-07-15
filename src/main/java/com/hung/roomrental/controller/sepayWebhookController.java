package com.hung.roomrental.controller;

import com.hung.roomrental.dto.sepayWebhookRequest;
import com.hung.roomrental.entity.payment;
import com.hung.roomrental.entity.renter;
import com.hung.roomrental.entity.room;
import com.hung.roomrental.repository.paymentRepository;
import com.hung.roomrental.repository.renterRepository;
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
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/payments")
public class sepayWebhookController {

    @Autowired
    private roomRepository roomRepo;

    @Autowired
    private paymentRepository paymentRepo;

    @Autowired
    private renterRepository renterRepo;

    // Mã bảo mật tự chọn khớp với cấu hình trên SePay Dashboard
    private final String API_KEY = "api_go_dau_hung_fabulous";

    @GetMapping
    public List<payment> getAllPayments() {
        return paymentRepo.findAll();
    }

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

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            LocalDateTime paymentDateTime = LocalDateTime.parse(request.getTransactionDate(), formatter);
            
            // Định dạng tháng xuất hóa đơn (Ví dụ: '2026-07')
            String billingMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

            // 5. Ghi nhận hóa đơn vào DB
            payment newPayment = payment.builder()
                    .roomNumber(roomNumber)
                    .amount(request.getTransferAmount())
                    .billingMonth(billingMonth)
                    .paymentDate(paymentDateTime)
                    .status("PAID")
                    .transactionId(sepayTxId)
                    .build();

            paymentRepo.save(newPayment);



            // 4. Nếu phát hiện số phòng hợp lệ và có trong Database
            if (roomNumber != null) {
                // Định dạng ngày giờ giao dịch nhận được từ SePay
 
                System.out.println("✅ Tự động xác nhận thanh toán thành công " + request.getTransferAmount() + "đ cho phòng: " + roomNumber);
            } else {
                System.out.println("❌ Không tìm thấy bất kỳ số phòng 3 chữ số nào hợp lệ trong dữ liệu giao dịch: subAccount=" 
                        + request.getSubAccount() + ", content=" + request.getContent());
            }
            return ResponseEntity.ok("Xử lý thành công");

        } catch (Exception e) {
            System.err.println("❌ Lỗi hệ thống khi xử lý Webhook: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi máy chủ nội bộ");
        }

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
    @GetMapping("/room-status")
    public ResponseEntity<?> getRoomPaymentStatus(@RequestParam(value = "month", required = false) String month) {
        // Nếu không truyền tháng, mặc định lấy tháng hiện tại
        if (month == null || month.isBlank()) {
            month = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        }

        List<com.hung.roomrental.entity.room> allRooms = roomRepo.findAll();
        List<payment> payments = paymentRepo.findByBillingMonth(month);

        // Gom nhóm tổng số tiền đã thanh toán của từng phòng trong tháng đó
        Map<String, BigDecimal> paidMap = new HashMap<>();
        for (payment p : payments) {
            if (p.getRoomNumber() != null) {
                BigDecimal currentSum = paidMap.getOrDefault(p.getRoomNumber(), BigDecimal.ZERO);
                paidMap.put(p.getRoomNumber(), currentSum.add(p.getAmount()));
            }
        }

        // Tạo cấu trúc dữ liệu trả về cho frontend
        List<Map<String, Object>> result = new ArrayList<>();
        for (com.hung.roomrental.entity.room r : allRooms) {
            BigDecimal totalPaid = paidMap.getOrDefault(r.getRoomNumber(), BigDecimal.ZERO);
            
            // Một phòng được coi là Đã đóng nếu tổng số tiền đóng lớn hơn hoặc bằng giá thuê phòng
            boolean isPaid = totalPaid.compareTo(r.getPrice()) >= 0;

            Map<String, Object> statusMap = new HashMap<>();
            statusMap.put("roomNumber", r.getRoomNumber());
            statusMap.put("price", r.getPrice());
            statusMap.put("totalPaid", totalPaid);
            statusMap.put("isPaid", isPaid);
            result.add(statusMap);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/room-details")
    public ResponseEntity<?> getRoomPaymentDetails(
            @RequestParam("roomNumber") String roomNumber,
            @RequestParam(value = "month", required = false) String month) {

        if (month == null || month.isBlank()) {
            month = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        }

        room r = roomRepo.findById(roomNumber).orElse(null);
        if (r == null) {
            return ResponseEntity.badRequest().body("Không tìm thấy phòng " + roomNumber);
        }

        List<payment> payments = paymentRepo.findByRoomNumberAndBillingMonth(roomNumber, month);

        BigDecimal totalPaid = payments.stream()
                .map(payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal roomPrice = r.getPrice() != null ? r.getPrice() : BigDecimal.ZERO;
        BigDecimal remaining = roomPrice.subtract(totalPaid);

        List<renter> renters = renterRepo.findByRoomRoomNumber(roomNumber);
        List<Map<String, String>> renterInfos = renters.stream().map(renter -> {
            Map<String, String> info = new HashMap<>();
            info.put("fullName", renter.getFullName());
            info.put("phone", renter.getPhone() != null ? renter.getPhone() : "-");
            return info;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("roomNumber", r.getRoomNumber());
        response.put("billingMonth", month);
        response.put("price", roomPrice);
        response.put("totalPaid", totalPaid);
        response.put("remaining", remaining.compareTo(BigDecimal.ZERO) > 0 ? remaining : BigDecimal.ZERO);
        response.put("isPaid", totalPaid.compareTo(roomPrice) >= 0);
        response.put("renters", renterInfos);
        response.put("payments", payments);

        return ResponseEntity.ok(response);
    }
}

