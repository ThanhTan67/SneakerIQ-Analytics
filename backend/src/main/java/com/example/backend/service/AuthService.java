package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.PasswordResetToken;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.enums.GenderOptions;
import com.example.backend.exception.BusinessException;
import com.example.backend.repository.PasswordResetTokenRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.util.OTPGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_DURATION_SECONDS = 300;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final OTPGenerator otpGenerator;

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:3}")
    private int maxOtpAttempts;

    @Value("${app.email.mock:false}")
    private boolean mockEmail;

    @Transactional
    public void signup(SignupRequest request) {
        validateSignupRequest(request);

        if (userRepository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            throw new BusinessException("Email is already registered", "EMAIL_ALREADY_EXISTS");
        }
        if (userRepository.findByPhoneNumber(request.getPhoneNumber().trim()).isPresent()) {
            throw new BusinessException("Phone number is already registered", "PHONE_ALREADY_EXISTS");
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new BusinessException("Role USER does not exist - please seed data", "ROLE_NOT_FOUND"));

        GenderOptions gender;
        try {
            gender = GenderOptions.valueOf(request.getGender().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid gender value", "INVALID_GENDER");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPhoneNumber(request.getPhoneNumber().trim());
        user.setGender(gender);
        user.setBirthDate(LocalDate.parse(request.getDateOfBirth()));
        user.setHashedPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(userRole);
        user.setEnabled(true);
        user.setLocked(false);
        user.setFailed(0);
        user.setTokenVersion(0);

        userRepository.save(user);
        log.info("Signup successful: {}", user.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null;
        String phone = req.getPhoneNumber() != null ? req.getPhoneNumber().trim() : null;

        if ((email == null || email.isBlank()) && (phone == null || phone.isBlank())) {
            throw new BusinessException("Please enter email or phone number", "MISSING_CREDENTIALS");
        }
        if (email != null && !email.isBlank() && phone != null && !phone.isBlank()) {
            throw new BusinessException("Please enter either email or phone number, not both", "MULTIPLE_CREDENTIALS");
        }

        User user = email != null
                ? userRepository.findByEmail(email).orElse(null)
                : userRepository.findByPhoneNumber(phone).orElse(null);

        if (user == null) {
            passwordEncoder.matches(req.getPassword(), "dummy_hash_for_timing_attack_protection");
            log.warn("Login failed - user not found: {}", email != null ? email : phone);
            throw new BusinessException("Invalid login credentials", "INVALID_CREDENTIALS");
        }

        if (!user.isEnabled()) {
            log.warn("Login failed - account disabled: {}", user.getEmail());
            throw new BusinessException("Account has been disabled", "ACCOUNT_DISABLED");
        }

        if (user.isLocked()) {
            if (user.getLockTime() != null && Instant.now().isAfter(user.getLockTime().plusSeconds(LOCK_DURATION_SECONDS))) {
                user.setLocked(false);
                user.setLockTime(null);
                user.setFailed(0);
                userRepository.save(user);
                log.info("Account unlocked automatically: {}", user.getEmail());
            } else {
                log.warn("Login failed - account locked: {}", user.getEmail());
                throw new BusinessException("Account is temporarily locked. Please try again later.", "ACCOUNT_LOCKED");
            }
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getHashedPassword())) {
            handleFailedAttempt(user);
            log.warn("Login failed - invalid password: {}", user.getEmail());
            throw new BusinessException("Invalid login credentials", "INVALID_CREDENTIALS");
        }

        user.setFailed(0);
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getId(), user.getTokenVersion());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail(), user.getId(), user.getTokenVersion());

        log.info("Login successful: {}", user.getEmail());
        return new AuthResponse(accessToken, refreshToken, user.getFullName());
    }

    public void logout(String username) {
        if(username == null || username.isBlank()) {
            log.warn("Logout failed - username is null or empty");
            throw new BusinessException("Username is null or empty", "USER_NOT_FOUND");
        }

        User user = userRepository.findUserByFullName(username).orElse(null);

        if (user == null) {
            log.warn("User not found: {}", username);
            throw new BusinessException("User not found", "USER_NOT_FOUND");
        }
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        log.info("Logout successful: {}", user.getFullName());
    }


    private void handleFailedAttempt(User user) {
        user.setFailed(user.getFailed() + 1);
        if (user.getFailed() >= MAX_FAILED_ATTEMPTS) {
            user.setLocked(true);
            user.setLockTime(Instant.now());
            log.warn("Account locked due to {} failed attempts: {}", MAX_FAILED_ATTEMPTS, user.getEmail());
        }
        userRepository.save(user);
    }

    private void validateSignupRequest(SignupRequest req) {
        if (req == null) {
            throw new BusinessException("Signup request cannot be empty", "EMPTY_REQUEST");
        }
        if (isBlank(req.getEmail()) || !EMAIL_PATTERN.matcher(req.getEmail()).matches()) {
            throw new BusinessException("Invalid email format", "INVALID_EMAIL");
        }
        if (isBlank(req.getPassword()) || req.getPassword().length() < 8) {
            throw new BusinessException("Password must be at least 8 characters long", "INVALID_PASSWORD");
        }
        if (isBlank(req.getFullName())) {
            throw new BusinessException("Full name cannot be empty", "EMPTY_FULLNAME");
        }
        if (isBlank(req.getPhoneNumber())) {
            throw new BusinessException("Phone number cannot be empty", "EMPTY_PHONE");
        }
        if (isBlank(req.getDateOfBirth())) {
            throw new BusinessException("Date of birth cannot be empty", "EMPTY_DOB");
        }
        if (isBlank(req.getGender())) {
            throw new BusinessException("Gender cannot be empty", "EMPTY_GENDER");
        }
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isBlank();
    }

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found", "USER_NOT_FOUND"));

        if (!user.isEnabled()) {
            throw new BusinessException("Account is disabled. Please contact support.", "ACCOUNT_DISABLED");
        }

        tokenRepository.invalidateAllUserTokens(email);

        String otp = otpGenerator.generateOTP();
        Instant expiryDate = Instant.now().plus(otpExpiryMinutes, ChronoUnit.MINUTES);

        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setOtp(otp);
        token.setExpiryDate(expiryDate);

        tokenRepository.save(token);

        sendOtpEmailAsync(user, otp);
    }

    @Transactional
    public void verifyOTP(VerifyOTPRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();

        PasswordResetToken token = tokenRepository.findByEmailAndOtpAndUsedFalse(email, otp)
                .orElseThrow(() -> new BusinessException("Invalid or expired verification code", "INVALID_OTP"));

        if (token.isExpired()) {
            token.setUsed(true);
            tokenRepository.save(token);
            throw new BusinessException("Verification code has expired. Please request a new one.", "OTP_EXPIRED");
        }

        token.setAttemptCount(token.getAttemptCount() + 1);
        tokenRepository.save(token);

        if (token.getAttemptCount() > maxOtpAttempts) {
            token.setUsed(true);
            tokenRepository.save(token);
            throw new BusinessException("Too many invalid attempts. Please request a new code.", "MAX_OTP_ATTEMPTS");
        }

        log.info("OTP verified successfully for: {}", email);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        if (!newPassword.equals(confirmPassword)) {
            throw new BusinessException("Passwords do not match", "PASSWORD_MISMATCH");
        }

        PasswordResetToken token = tokenRepository.findByEmailAndOtpAndUsedFalse(email, otp)
                .orElseThrow(() -> new BusinessException("Invalid or expired verification code", "INVALID_OTP"));

        if (token.isExpired()) {
            token.setUsed(true);
            tokenRepository.save(token);
            throw new BusinessException("Verification code has expired. Please request a new one.", "OTP_EXPIRED");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found", "USER_NOT_FOUND"));

        user.setHashedPassword(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
        tokenRepository.invalidateAllUserTokens(email);

        sendConfirmationEmailAsync(user);
    }

    @Transactional
    public void resendOTP(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found", "USER_NOT_FOUND"));

        tokenRepository.findFirstByEmailAndUsedFalseOrderByCreatedAtDesc(email)
                .ifPresent(token -> {
                    if (!token.isExpired() && token.getCreatedAt().plus(1, ChronoUnit.MINUTES).isAfter(Instant.now())) {
                        long remainingSeconds = 60 - ChronoUnit.SECONDS.between(token.getCreatedAt(), Instant.now());
                        throw new BusinessException(
                                String.format("Please wait %d seconds before requesting a new code", remainingSeconds),
                                "RESEND_TOO_SOON"
                        );
                    }
                });

        String otp = otpGenerator.generateOTP();
        Instant expiryDate = Instant.now().plus(otpExpiryMinutes, ChronoUnit.MINUTES);

        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setOtp(otp);
        token.setExpiryDate(expiryDate);

        tokenRepository.save(token);

        // Send email asynchronously - don't throw if fails
        sendOtpEmailAsync(user, otp);
    }

    @Transactional
    public void cleanupExpiredTokens() {
        int deletedCount = tokenRepository.deleteAllExpiredTokens(Instant.now());
        log.info("Cleaned up {} expired password reset tokens", deletedCount);
    }

    // ==================== PRIVATE EMAIL HELPER METHODS ====================

    /**
     * Send OTP email asynchronously - never throws exception to caller
     * OTP is already saved in DB, so email failure doesn't block the flow
     */
    private void sendOtpEmailAsync(User user, String otp) {
        if (mockEmail) {
            log.info("[MOCK] OTP for {}: {}", user.getEmail(), otp);
            return;
        }

        emailService.sendPasswordResetOTP(user.getEmail(), otp, otpExpiryMinutes, user.getFullName())
                .thenAccept(success -> {
                    if (success) {
                        log.debug("OTP email sent to: {}", user.getEmail());
                    }
                })
                .exceptionally(throwable -> {
                    log.error("Failed to send OTP email to: {} - {}",
                            user.getEmail(), throwable.getMessage());
                    return null;
                });
    }

    /**
     * Send confirmation email asynchronously - never throws exception to caller
     * Password already reset successfully, so email failure doesn't affect user
     */
    private void sendConfirmationEmailAsync(User user) {
        if (mockEmail) {
            log.info("[MOCK] Password reset confirmed for: {}", user.getEmail());
            return;
        }

        emailService.sendPasswordResetConfirmation(user.getEmail(), user.getFullName())
                .exceptionally(throwable -> {
                    log.error("Failed to send confirmation email to: {} - {}",
                            user.getEmail(), throwable.getMessage());
                    return null;
                });
    }
}