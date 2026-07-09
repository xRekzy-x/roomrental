package com.hung.roomrental.controller;

import com.hung.roomrental.entity.renter;
import com.hung.roomrental.repository.renterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/renters")
public class renterController {

    @Autowired
    private renterRepository renterRepo;

    @GetMapping
    public List<renter> getAllRenters() {
        return renterRepo.findAll();
    }

    @PostMapping
    public renter createRenter(@RequestBody renter newRenter) {
        return renterRepo.save(newRenter);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRenter(@PathVariable Long id) {
        return renterRepo.findById(id).map(r -> {
            renterRepo.delete(r);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}