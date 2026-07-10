package com.hung.roomrental.repository;

import com.hung.roomrental.entity.room;
import com.hung.roomrental.entity.roomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface roomRepository extends JpaRepository<room, String> {
    Optional<room> findByRoomNumber(String roomNumber);

    List<room> findByStatus(roomStatus status);
}
