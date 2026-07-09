package com.hung.roomrental.repository;

import com.hung.roomrental.entity.vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface vehicleRepository extends JpaRepository<vehicle, Long> {
    Optional<vehicle> findByPlateNumber(String plateNumber);

    List<vehicle> findByRenterId(Long renterId);
}
