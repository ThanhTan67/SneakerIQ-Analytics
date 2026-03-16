package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse("Register successfully", true));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(new ForgotPasswordResponse(
                "Verification code sent to your email",
                request.getEmail(),
                300
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<OTPVerificationResponse> verifyOTP(@Valid @RequestBody VerifyOTPRequest request) {
        authService.verifyOTP(request);
        return ResponseEntity.ok(new OTPVerificationResponse(
                "OTP verified successfully",
                request.getEmail(),
                true,
                null
        ));
    }

    @PostMapping("/reset")
    public ResponseEntity<ForgotPasswordResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new ForgotPasswordResponse(
                "Password reset successfully. Please login with your new password.",
                request.getEmail(),
                null
        ));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ForgotPasswordResponse> resendOTP(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resendOTP(request);
        return ResponseEntity.ok(new ForgotPasswordResponse(
                "New verification code sent to your email",
                request.getEmail(),
                300
        ));
    }
}