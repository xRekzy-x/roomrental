package com.hung.roomrental.repository;

import com.hung.roomrental.entity.room;
import com.hung.roomrental.entity.roomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface roomRepository extends JpaRepository<room, String> {
    Optional<room> findByRoomNumber(String roomNumber);

    List<room> findByStatus(roomStatus status);

    @Modifying
    @Transactional
    @Query("UPDATE room r SET r.status = :status WHERE r.roomNumber = :roomNumber")
    void updateRoomStatus(@Param("roomNumber") String roomNumber, @Param("status") roomStatus status);
}