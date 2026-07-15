package com.hung.roomrental.controller;

import com.hung.roomrental.entity.account;
import com.hung.roomrental.entity.renter;
import com.hung.roomrental.repository.accountRepository;
import com.hung.roomrental.repository.renterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class accountController {

    @Autowired
    private accountRepository accountRepo;

    @Autowired
    private renterRepository renterRepo;

    @GetMapping
    public List<account> getAllAccounts() {
        return accountRepo.findAll();
    }

    @PostMapping
    public account createAccount(@RequestBody account newAccount) {
        return accountRepo.save(newAccount);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id) {
        return accountRepo.findById(id).map(acc -> {
            accountRepo.delete(acc);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

 @PutMapping("/{id}")
    public ResponseEntity<?> updateAccount(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        return accountRepo.findById(id).map(acc -> {
            acc.setUsername((String) payload.get("username"));
            
            String password = (String) payload.get("password");
            if (password != null && !password.isBlank()) {
                acc.setPassword(password);
            }
            
            acc.setRole(com.hung.roomrental.entity.role.valueOf((String) payload.get("role")));
            
            String renterId = (String) payload.get("renterId");
            if (renterId != null && !renterId.isBlank()) {
                renter r = renterRepo.findById(renterId).orElse(null);
                acc.setRenter(r);
            } else {
                acc.setRenter(null);
            }

            return ResponseEntity.ok(accountRepo.save(acc));
        }).orElse(ResponseEntity.notFound().build());
    }
}