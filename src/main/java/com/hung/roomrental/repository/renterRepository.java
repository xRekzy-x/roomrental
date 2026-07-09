package com.hung.roomrental.repository;

import com.hung.roomrental.entity.renter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface renterRepository extends JpaRepository<renter, Long> {
    Optional<renter> findByCccdNumber(String cccdNumber);

    List<renter> findByRoomId(Long roomId);
}
