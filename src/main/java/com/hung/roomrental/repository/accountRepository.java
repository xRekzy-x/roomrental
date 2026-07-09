package com.hung.roomrental.repository;

import com.hung.roomrental.entity.account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface accountRepository extends JpaRepository<account, Long> {
    Optional<account> findByUsername(String username);

    Optional<account> findByRenterId(Long renterId);
}
