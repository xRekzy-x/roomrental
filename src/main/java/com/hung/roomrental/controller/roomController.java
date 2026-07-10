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
    public room createRoom(@RequestBody room newRoom) {
        return roomRepo.save(newRoom);
    }

    @DeleteMapping("/{roomNumber}")
    public ResponseEntity<?> deleteRoom(@PathVariable String roomNumber) {
        return roomRepo.findById(roomNumber).map(r -> {
            roomRepo.delete(r);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}