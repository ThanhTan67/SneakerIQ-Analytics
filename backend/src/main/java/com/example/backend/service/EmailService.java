package com.example.backend.service;

import java.util.concurrent.CompletableFuture;

public interface EmailService {
    /**
     * Send password reset OTP email asynchronously
     */
    CompletableFuture<Boolean> sendPasswordResetOTP(String to, String otp, int expiryMinutes, String userName);

    /**
     * Send password reset confirmation email asynchronously
     */
    CompletableFuture<Boolean> sendPasswordResetConfirmation(String to, String userName);

    /**
     * Send password reset OTP email synchronously (blocking)
     */
    boolean sendPasswordResetOTPSync(String to, String otp, int expiryMinutes, String userName);
}