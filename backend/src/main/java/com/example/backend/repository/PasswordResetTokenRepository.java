package com.example.backend.repository;

import com.example.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByEmailAndOtpAndUsedFalse(String email, String otp);

    Optional<PasswordResetToken> findFirstByEmailAndUsedFalseOrderByCreatedAtDesc(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate < :now")
    int deleteAllExpiredTokens(@Param("now") Instant now);

    @Modifying
    @Transactional
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.email = :email")
    void invalidateAllUserTokens(@Param("email") String email);
}