package com.hung.roomrental.controller;

import com.hung.roomrental.entity.renter;
import com.hung.roomrental.entity.room;
import com.hung.roomrental.repository.renterRepository;
import com.hung.roomrental.repository.roomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/renters")
public class renterController {

    @Autowired
    private renterRepository renterRepo;

    @Autowired
    private roomRepository roomRepo;

    @GetMapping
    public List<renter> getAllRenters() {
        List<renter> renters = renterRepo.findAll();
        for (renter r : renters) {
            if (r.getRoom() != null) {
                r.setRoomNumber(r.getRoom().getRoomNumber());
            }
        }
        return renters;
    }

       @PostMapping
    public ResponseEntity<?> createRenter(@RequestBody renter newRenter) {
        try {
            // 1. Xác định số phòng được gửi từ Client lên
            String targetRoomNumber = null;
            if (newRenter.getRoomNumber() != null && !newRenter.getRoomNumber().isBlank()) {
                targetRoomNumber = newRenter.getRoomNumber().trim();
            } else if (newRenter.getRoom() != null && newRenter.getRoom().getRoomNumber() != null) {
                targetRoomNumber = newRenter.getRoom().getRoomNumber().trim();
            }

            if (targetRoomNumber == null || targetRoomNumber.isBlank()) {
                return ResponseEntity.badRequest().body("Vui lòng cung cấp số phòng của khách thuê.");
            }

            // 2. Tìm kiếm thực thể phòng trong Database
            room existingRoom = roomRepo.findById(targetRoomNumber).orElse(null);
            if (existingRoom == null) {
                return ResponseEntity.badRequest().body("Phòng trọ mang số " + targetRoomNumber + " không tồn tại!");
            }

            // 3. Sử dụng Native Query để ghi trực tiếp xuống DB (bỏ qua cơ chế quản lý ID tự động của Hibernate)
            renterRepo.insertRenterNative(
                newRenter.getFullName(),
                newRenter.getCccdNumber(),
                newRenter.getPhone(),
                newRenter.getDob(),
                targetRoomNumber
            );

            // 4. Tìm lại thực thể vừa lưu thông qua cccdNumber để nhận thông tin ID thực tế do Trigger tạo ra
            renter savedRenter = renterRepo.findByCccdNumber(newRenter.getCccdNumber())
                .orElseThrow(() -> new RuntimeException("Không thể tìm thấy khách thuê sau khi thêm mới."));

            // 5. Cập nhật lại số phòng thô để JSON phản hồi chuẩn xác
            if (savedRenter.getRoom() != null) {
                savedRenter.setRoomNumber(savedRenter.getRoom().getRoomNumber());
            }

            return ResponseEntity.ok(savedRenter);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi máy chủ: " + e.getMessage());
        }
    }
    // @PostMapping
    // public ResponseEntity<?> createRenter(@RequestBody renter newRenter) {
    //     try {
    //         if (newRenter == null) {
    //             return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu khách thuê trống."));
    //         }

    //         String roomNumber = newRenter.getRoomNumber();
    //         if (roomNumber != null) {
    //             roomNumber = roomNumber.trim();
    //         }

    //         if (roomNumber == null || roomNumber.isBlank()) {
    //             return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập số phòng."));
    //         }

    //         room existingRoom = roomRepo.findById(roomNumber).orElse(null);
    //         if (existingRoom == null) {
    //             return ResponseEntity.badRequest().body(Map.of("message", "Phòng " + roomNumber + " không tồn tại."));
    //         }

    //         newRenter.setRoom(existingRoom);
    //         newRenter.setRoomNumber(roomNumber);

    //         if (newRenter.getId() == null || newRenter.getId().isBlank()) {
    //             newRenter.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 20));
    //         }

    //         renter savedRenter = renterRepo.save(newRenter);
    //         if (savedRenter.getRoom() != null) {
    //             savedRenter.setRoomNumber(savedRenter.getRoom().getRoomNumber());
    //         }
    //         return ResponseEntity.ok(savedRenter);
    //     } catch (Exception ex) {
    //         return ResponseEntity.status(500).body(Map.of("message", ex.getClass().getSimpleName() + ": " + ex.getMessage()));
    //     }
    // }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRenter(@PathVariable String id) {
        return renterRepo.findById(id).map(r -> {
            renterRepo.delete(r);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}