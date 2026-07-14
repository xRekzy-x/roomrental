package com.hung.roomrental.controller;

import com.hung.roomrental.entity.room;
import com.hung.roomrental.repository.roomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class roomController {

    @Autowired
    private roomRepository roomRepo;

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

                    room.setArea(updatedRoom.getArea());
                    room.setPrice(updatedRoom.getPrice());
                    room.setStatus(updatedRoom.getStatus());

                    return ResponseEntity.ok(roomRepo.save(room));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}