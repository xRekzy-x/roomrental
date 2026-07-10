package com.hung.roomrental.repository;

import com.hung.roomrental.entity.renter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface renterRepository extends JpaRepository<renter, String> {
    Optional<renter> findByCccdNumber(String cccdNumber);

    List<renter> findByRoomRoomNumber(String roomNumber);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO renter (full_name, cccd_number, phone, dob, room_number) VALUES (:fullName, :cccdNumber, :phone, :dob, :roomNumber)", nativeQuery = true)
    void insertRenterNative(
        @Param("fullName") String fullName,
        @Param("cccdNumber") String cccdNumber,
        @Param("phone") String phone,
        @Param("dob") LocalDate dob,
        @Param("roomNumber") String roomNumber
    );

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM renter WHERE id = :id", nativeQuery = true)
    void deleteRenterNative(@Param("id") String id);
}