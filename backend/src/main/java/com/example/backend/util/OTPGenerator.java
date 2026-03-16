package com.example.backend.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class OTPGenerator {

    private static final SecureRandom random = new SecureRandom();
    private static final int OTP_LENGTH = 6;

    public String generateOTP() {
        StringBuilder otp = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10)); // 0-9
        }
        return otp.toString();
    }
}
