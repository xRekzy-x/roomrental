package com.hung.roomrental.controller;

import com.hung.roomrental.entity.room;
import com.hung.roomrental.entity.vehicle;
import com.hung.roomrental.repository.roomRepository;
import com.hung.roomrental.repository.vehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class vehicleController {

    @Autowired
    private vehicleRepository vehicleRepo;

    @Autowired
    private roomRepository roomRepo;

    @GetMapping
    public List<vehicle> getAllVehicles() {
        return vehicleRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createVehicle(@RequestBody vehicle newVehicle) {
        try {
            // 1. Kiểm tra rỗng tránh lỗi NullPointerException gây lỗi 500
            if (newVehicle.getPlateNumber() == null || newVehicle.getPlateNumber().isBlank()) {
                return ResponseEntity.badRequest().body("Vui lòng cung cấp biển số xe hợp lệ.");
            }

            // 2. Xác định số phòng dựa trên dữ liệu phẳng roomNumber gửi từ Client
            String targetRoomNumber = null;
            if (newVehicle.getRoomNumber() != null && !newVehicle.getRoomNumber().isBlank()) {
                targetRoomNumber = newVehicle.getRoomNumber().trim();
            } else if (newVehicle.getRoom() != null && newVehicle.getRoom().getRoomNumber() != null) {
                targetRoomNumber = newVehicle.getRoom().getRoomNumber().trim();
            }

            if (targetRoomNumber == null || targetRoomNumber.isBlank()) {
                return ResponseEntity.badRequest().body("Vui lòng cung cấp số phòng sở hữu phương tiện.");
            }
            
            // 3. Tìm kiếm thực thể phòng trong Database
            room existingRoom = roomRepo.findById(targetRoomNumber).orElse(null);
            if (existingRoom == null) {
                return ResponseEntity.badRequest().body("Phòng trọ mang số " + targetRoomNumber + " không tồn tại!");
            }

            // 4. Sử dụng Native Query để ghi trực tiếp (giống renter)
            vehicleRepo.insertVehicleNative(
                newVehicle.getPlateNumber().trim(),
                newVehicle.getVehicleType() != null ? newVehicle.getVehicleType().trim() : null,
                targetRoomNumber
            );

            // 5. Tìm lại thực thể vừa lưu thông qua plateNumber
            vehicle savedVehicle = vehicleRepo.findByPlateNumber(newVehicle.getPlateNumber().trim())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phương tiện sau khi thêm mới."));

            return ResponseEntity.ok(savedVehicle);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi máy chủ: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable String id) {
        return vehicleRepo.findById(id).map(v -> {
            vehicleRepo.delete(v);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<vehicle> updateVehicle(
            @PathVariable String id,
            @RequestBody vehicle updated){

        return vehicleRepo.findById(id).map(v->{

            v.setPlateNumber(updated.getPlateNumber());
            v.setVehicleType(updated.getVehicleType());

            if(updated.getRoomNumber()!=null){

                room room=roomRepo.findById(updated.getRoomNumber())
                        .orElseThrow();

                v.setRoom(room);
            }

            return ResponseEntity.ok(vehicleRepo.save(v));

        }).orElse(ResponseEntity.notFound().build());
    }
}