package com.example.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;

@Service
@ConditionalOnProperty(name = "app.email.mock", havingValue = "true")
@Slf4j
public class MockEmailService implements EmailService {

    @Override
    public CompletableFuture<Boolean> sendPasswordResetOTP(String to, String otp, int expiryMinutes, String userName) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"));

        log.info("\n" +
                        "╔════════════════════════════════════════════════════════╗\n" +
                        "║                 📧 MOCK EMAIL (OTP)                    ║\n" +
                        "╠════════════════════════════════════════════════════════╣\n" +
                        "║ To:      {}\n" +
                        "║ User:    {}\n" +
                        "║ OTP:     {}\n" +
                        "║ Expires: {} minutes\n" +
                        "║ Time:    {}\n" +
                        "╚════════════════════════════════════════════════════════╝",
                to, userName != null ? userName : "N/A", otp, expiryMinutes, timestamp);

        return CompletableFuture.completedFuture(true);
    }

    @Override
    public CompletableFuture<Boolean> sendPasswordResetConfirmation(String to, String userName) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"));

        log.info("\n" +
                        "╔════════════════════════════════════════════════════════╗\n" +
                        "║            📧 MOCK EMAIL (CONFIRMATION)                ║\n" +
                        "╠════════════════════════════════════════════════════════╣\n" +
                        "║ To:      {}\n" +
                        "║ User:    {}\n" +
                        "║ Time:    {}\n" +
                        "╚════════════════════════════════════════════════════════╝",
                to, userName != null ? userName : "N/A", timestamp);

        return CompletableFuture.completedFuture(true);
    }

    @Override
    public boolean sendPasswordResetOTPSync(String to, String otp, int expiryMinutes, String userName) {
        return sendPasswordResetOTP(to, otp, expiryMinutes, userName).join();
    }
}