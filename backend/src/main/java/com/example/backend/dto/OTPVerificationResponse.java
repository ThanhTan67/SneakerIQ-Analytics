package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OTPVerificationResponse {
    private String message;
    private String email;
    private boolean verified;
    private String resetToken; // Optional: for additional security
}