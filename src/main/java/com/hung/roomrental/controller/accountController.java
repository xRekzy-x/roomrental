package com.hung.roomrental.controller;

import com.hung.roomrental.entity.account;
import com.hung.roomrental.repository.accountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class accountController {

    @Autowired
    private accountRepository accountRepo;

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
}