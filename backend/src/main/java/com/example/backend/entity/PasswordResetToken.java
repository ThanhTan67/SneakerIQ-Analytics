package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Table(name = "password_reset_tokens")
public class PasswordResetToken extends BaseEntity {
    @Column(nullable = false)
    private String email;

    @Column(nullable = false, unique = true)
    private String otp;

    @Column(nullable = false)
    private Instant expiryDate;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false)
    private Integer attemptCount = 0;

    public boolean isExpired() {
        return Instant.now().isAfter(expiryDate);
    }
}