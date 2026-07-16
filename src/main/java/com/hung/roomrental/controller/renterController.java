package com.hung.roomrental.controller;

import com.hung.roomrental.entity.renter;
import com.hung.roomrental.entity.room;
import com.hung.roomrental.repository.renterRepository;
import com.hung.roomrental.repository.roomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.hung.roomrental.entity.roomStatus;

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
            // Convert dob to string (YYYY-MM-DD) for native query parameter binding
            String dobStr = null;
            if (newRenter.getDob() != null) {
                dobStr = newRenter.getDob().toString();
            }

            renterRepo.insertRenterNative(
                newRenter.getFullName(),
                newRenter.getCccdNumber(),
                newRenter.getPhone(),
                dobStr,
                targetRoomNumber
            );

            // 4. Tìm lại thực thể vừa lưu thông qua cccdNumber để nhận thông tin ID thực tế do Trigger tạo ra
            renter savedRenter = renterRepo.findByCccdNumber(newRenter.getCccdNumber())
                .orElseThrow(() -> new RuntimeException("Không thể tìm thấy khách thuê sau khi thêm mới."));

            // 5. Cập nhật lại số phòng thô để JSON phản hồi chuẩn xác
            if (savedRenter.getRoom() != null) {
                savedRenter.setRoomNumber(savedRenter.getRoom().getRoomNumber());
            }

            if (existingRoom.getStatus() == roomStatus.AVAILABLE) {
                roomRepo.updateRoomStatus(targetRoomNumber, roomStatus.OCCUPIED);
                savedRenter.getRoom().setStatus(roomStatus.OCCUPIED);
            }


            return ResponseEntity.ok(savedRenter);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi máy chủ: " + e.getMessage());
        }
    }
   
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRenter(@PathVariable String id) {
        return renterRepo.findById(id).map(r -> {
            String roomNumber = (r.getRoom() != null) ? r.getRoom().getRoomNumber() : null;

            renterRepo.delete(r);
            renterRepo.flush(); // Ép đồng bộ xuống DB ngay lập tức để Trigger giảm current_renters được kích hoạt

            // Sau khi xóa xong, kiểm tra số lượng người thuê thực tế còn lại trong phòng
            if (roomNumber != null) {
                long remainingRenters = renterRepo.countRentersInRoom(roomNumber);
                if (remainingRenters == 0) {
                    roomRepo.updateRoomStatus(roomNumber, roomStatus.AVAILABLE);
                }
            }

            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRenter(
            @PathVariable String id,
            @RequestBody renter updated) {

        try {

            renter r = renterRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy khách thuê."));

            // 1. Lưu lại thông tin phòng cũ và phòng mới (nếu có thay đổi)
            String oldRoomNumber = (r.getRoom() != null) ? r.getRoom().getRoomNumber() : null;
            String newRoomNumber = (updated.getRoomNumber() != null && !updated.getRoomNumber().isBlank()) 
                    ? updated.getRoomNumber().trim() 
                    : null;

            r.setFullName(updated.getFullName());
            r.setPhone(updated.getPhone());
            r.setDob(updated.getDob());

            boolean roomChanged = false;
            if (newRoomNumber != null && !newRoomNumber.equals(oldRoomNumber)) {
                room room = roomRepo.findById(newRoomNumber)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng " + newRoomNumber));
                r.setRoom(room);
                roomChanged = true;
            }

            renterRepo.saveAndFlush(r);

            // 3. Nếu khách được chuyển sang phòng khác, tiến hành cập nhật trạng thái của cả 2 phòng
            if (roomChanged) {
                // Đối với phòng cũ: Kiểm tra xem còn khách nào ở lại không
                if (oldRoomNumber != null) {
                    long remainingRenters = renterRepo.countRentersInRoom(oldRoomNumber);
                    if (remainingRenters == 0) {
                        roomRepo.updateRoomStatus(oldRoomNumber, roomStatus.AVAILABLE);
                    }
                }

                // Đối với phòng mới: Chuyển sang OCCUPIED nếu phòng này đang trống (AVAILABLE)
                if (newRoomNumber != null) {
                    roomRepo.findById(newRoomNumber).ifPresent(nr -> {
                        if (nr.getStatus() == roomStatus.AVAILABLE) {
                            roomRepo.updateRoomStatus(newRoomNumber, roomStatus.OCCUPIED);
                        }
                    });
                }
            }

            return ResponseEntity.ok(r);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi máy chủ: " + e.getMessage());
        }
    }
}