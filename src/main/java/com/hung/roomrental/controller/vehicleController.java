package com.hung.roomrental.controller;

import com.hung.roomrental.entity.vehicle;
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

    @GetMapping
    public List<vehicle> getAllVehicles() {
        return vehicleRepo.findAll();
    }

    @PostMapping
    public vehicle createVehicle(@RequestBody vehicle newVehicle) {
        return vehicleRepo.save(newVehicle);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        return vehicleRepo.findById(id).map(v -> {
            vehicleRepo.delete(v);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}