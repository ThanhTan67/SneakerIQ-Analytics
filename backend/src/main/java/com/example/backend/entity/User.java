package com.example.backend.entity;

import com.example.backend.enums.GenderOptions;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Getter @Setter @NoArgsConstructor
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "hashed_password")
    private String hashedPassword;

    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false)
    private GenderOptions gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ColumnDefault("0")
    @Column(nullable = false)
    private int failed = 0;

    @ColumnDefault("false")
    @Column(nullable = false)
    private boolean locked = false;

    @Column(name = "lock_time")
    private Instant lockTime;

    @ColumnDefault("0")
    @Column(nullable = false)
    private int tokenVersion = 0;

    @ColumnDefault("true")
    @Column(nullable = false)
    private boolean enabled = true;
}