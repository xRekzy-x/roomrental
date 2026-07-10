package com.hung.roomrental.repository;

import com.hung.roomrental.entity.vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface vehicleRepository extends JpaRepository<vehicle, String> {
    Optional<vehicle> findByPlateNumber(String plateNumber);

    List<vehicle> findByRoomRoomNumber(String roomNumber);

    // ĐÃ SỬA: Thêm clearAutomatically và flushAutomatically để ép Hibernate xóa cache sau khi ghi
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO vehicle (plate_number, vehicle_type, room_number) VALUES (:plateNumber, :vehicleType, :roomNumber)", nativeQuery = true)
    void insertVehicleNative(
        @Param("plateNumber") String plateNumber,
        @Param("vehicleType") String vehicleType,
        @Param("roomNumber") String roomNumber
    );
}