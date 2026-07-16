package com.hung.roomrental.controller;

import com.hung.roomrental.entity.utilityBill;
import com.hung.roomrental.entity.room;
import com.hung.roomrental.repository.utilityBillRepository;
import com.hung.roomrental.repository.roomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/utility-bills")
public class utilityBillController {

    @Autowired
    private utilityBillRepository billRepo;

    @Autowired
    private roomRepository roomRepo;

    @GetMapping
    public List<utilityBill> getAllBills(@RequestParam(value = "month", required = false) String month) {
        if (month != null && !month.isBlank()) {
            return billRepo.findByBillingMonth(month);
        }
        return billRepo.findAll();
    }

    @GetMapping("/room/{roomNumber}/month/{month}")
    public ResponseEntity<utilityBill> getBillByRoomAndMonth(
            @PathVariable String roomNumber,
            @PathVariable String month) {
        return billRepo.findByRoomNumberAndBillingMonth(roomNumber, month)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/suggest-previous/{roomNumber}")
    public ResponseEntity<?> suggestPreviousReadings(
            @PathVariable String roomNumber,
            @RequestParam("month") String currentMonth) {
        try {
            // Xác định kỳ tháng liền trước
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate date = LocalDate.parse(currentMonth + "-01", formatter).minusMonths(1);
            String prevMonth = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));

            Optional<utilityBill> prevBill = billRepo.findByRoomNumberAndBillingMonth(roomNumber, prevMonth);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            if (prevBill.isPresent()) {
                response.put("oldElectricity", prevBill.get().getNewElectricity());
            } else {
                response.put("oldElectricity", 0);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi định dạng kỳ hóa đơn: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createOrUpdateBill(@RequestBody utilityBill newBill) {
        if (newBill.getRoomNumber() == null || newBill.getRoomNumber().isBlank()) {
            return ResponseEntity.badRequest().body("Số phòng không được bỏ trống.");
        }
        if (newBill.getBillingMonth() == null || newBill.getBillingMonth().isBlank()) {
            return ResponseEntity.badRequest().body("Tháng thanh toán không được bỏ trống.");
        }

        room r = roomRepo.findById(newBill.getRoomNumber()).orElse(null);
        if (r == null) {
            return ResponseEntity.badRequest().body("Phòng trọ không tồn tại.");
        }

        if (newBill.getRoomPrice() == null) {
            newBill.setRoomPrice(r.getPrice());
        }

        Optional<utilityBill> existingOpt = billRepo.findByRoomNumberAndBillingMonth(newBill.getRoomNumber(), newBill.getBillingMonth());
        
        utilityBill billToSave;
        if (existingOpt.isPresent()) {
            utilityBill existing = existingOpt.get();
            existing.setOldElectricity(newBill.getOldElectricity());
            existing.setNewElectricity(newBill.getNewElectricity());
            existing.setElectricityFee(newBill.getElectricityFee());
            existing.setWaterFee(newBill.getWaterFee());
            existing.setInternetFee(newBill.getInternetFee());
            existing.setWashingMachineFee(newBill.getWashingMachineFee());
            existing.setOtherFee(newBill.getOtherFee());
            existing.setRoomPrice(newBill.getRoomPrice());
            billToSave = existing;
        } else {
            billToSave = newBill;
        }

        utilityBill saved = billRepo.save(billToSave);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBill(@PathVariable Long id) {
        return billRepo.findById(id).map(b -> {
            billRepo.delete(b);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}