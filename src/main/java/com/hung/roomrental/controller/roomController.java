package com.hung.roomrental.controller;

import com.hung.roomrental.entity.room;
import com.hung.roomrental.repository.roomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.hung.roomrental.entity.renter;
import com.hung.roomrental.entity.roomStatus;
import com.hung.roomrental.repository.renterRepository;
import com.hung.roomrental.repository.vehicleRepository;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class roomController {

    @Autowired
    private roomRepository roomRepo;

    @Autowired
    private renterRepository renterRepo;

    @Autowired
    private vehicleRepository vehicleRepo;

    @GetMapping
    public List<room> getAllRooms() {
        return roomRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody room newRoom) {
        
        System.out.println("Received new room data: " + newRoom);   
       // try {
            if (newRoom.getRoomNumber() == null || newRoom.getRoomNumber().isBlank()) {
                return ResponseEntity.badRequest().body("Số phòng không được để trống.");
            }
            if (roomRepo.existsById(newRoom.getRoomNumber())) {
                System.out.println("Phòng đã tồn tại: " + newRoom.getRoomNumber());
                return ResponseEntity.badRequest().body("Phòng đã tồn tại!");
            }
            room savedRoom = roomRepo.save(newRoom);
            return ResponseEntity.ok(savedRoom);
        // } catch (Exception e) {
        //     return ResponseEntity.status(500).body("Lỗi máy chủ: " + e.getMessage());
        // }
    }


    @DeleteMapping("/{roomNumber}")
    public ResponseEntity<?> deleteRoom(@PathVariable String roomNumber) {
        return roomRepo.findById(roomNumber).map(r -> {
            roomRepo.delete(r);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{roomNumber}")
    public ResponseEntity<room> updateRoom(
            @PathVariable String roomNumber, //Binds the roomNumber from the URL to the method parameter.
            @RequestBody room updatedRoom) { //Accepts the JSON payload representing the updated room details.

        return roomRepo.findById(roomNumber)
                .map(room -> {
                    roomStatus oldStatus = room.getStatus();
                    roomStatus newStatus = updatedRoom.getStatus();

                    room.setArea(updatedRoom.getArea());
                    room.setPrice(updatedRoom.getPrice());
                    room.setStatus(updatedRoom.getStatus());

                    // Nếu chuyển từ OCCUPIED -> AVAILABLE: xóa hết renter đang gắn với phòng
                    if (oldStatus == roomStatus.OCCUPIED && newStatus == roomStatus.AVAILABLE) {
                        List<renter> renters = renterRepo.findByRoomRoomNumber(roomNumber);
                        renterRepo.deleteAll(renters); // mỗi lần xóa sẽ tự kích hoạt trigger after_renter_delete
                    }

                    return ResponseEntity.ok(roomRepo.save(room));


                })
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/{roomNumber}/details")
    public ResponseEntity<?> getRoomDetails(@PathVariable String roomNumber) {
        return roomRepo.findById(roomNumber).map(room -> {
            java.util.Map<String, Object> details = new java.util.HashMap<>();
            details.put("roomNumber", room.getRoomNumber());
            details.put("area", room.getArea());
            details.put("price", room.getPrice());
            details.put("status", room.getStatus());
            details.put("currentRenters", room.getCurrentRenters());
            details.put("currentVehicles", room.getCurrentVehicles());

            // Tải danh sách khách thuê của phòng này
            List<renter> renters = renterRepo.findByRoomRoomNumber(roomNumber);
            List<java.util.Map<String, Object>> renterList = new java.util.ArrayList<>();
            for (renter r : renters) {
                java.util.Map<String, Object> rMap = new java.util.HashMap<>();
                rMap.put("fullName", r.getFullName());
                rMap.put("cccd", r.getCccdNumber());
                rMap.put("phone", r.getPhone() != null ? r.getPhone() : "-");
                rMap.put("dob", r.getDob() != null ? r.getDob().toString() : "-");
                renterList.add(rMap);
            }
            details.put("renters", renterList);

            // Tải danh sách phương tiện đăng ký của phòng này
            List<com.hung.roomrental.entity.vehicle> vehicles = vehicleRepo.findByRoomRoomNumber(roomNumber);
            List<java.util.Map<String, Object>> vehicleList = new java.util.ArrayList<>();
            for (com.hung.roomrental.entity.vehicle v : vehicles) {
                java.util.Map<String, Object> vMap = new java.util.HashMap<>();
                vMap.put("plateNumber", v.getPlateNumber());
                vMap.put("vehicleType", v.getVehicleType() != null ? v.getVehicleType() : "-");
                vehicleList.add(vMap);
            }
            details.put("vehicles", vehicleList);

            return ResponseEntity.ok(details);
        }).orElse(ResponseEntity.notFound().build());
    }
}