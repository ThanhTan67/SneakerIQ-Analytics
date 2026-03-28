package com.example.backend.controller;

import com.example.backend.dto.AccountInforResponse;
import com.example.backend.dto.ApiResponse;
import com.example.backend.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/account")
public class AccountController {
    private final AccountService accountService;

    @GetMapping()
    public ResponseEntity<?> getAccountInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.ok(new ApiResponse("No active login session", true));
        }
        String username = auth.getName();
        System.out.println("username: " + username);
        AccountInforResponse accountInforResponse = accountService.getAccountInfo(username);
        return ResponseEntity.ok(accountInforResponse);
    }
}
