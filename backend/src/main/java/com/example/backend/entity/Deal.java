package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "deals")
public class Deal extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id")
    private DataSource source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private String dealTitle;

    @Column(columnDefinition = "TEXT")
    private String dealDescription;

    private LocalDate startAt;

    private LocalDate endAt;

    private String dealType; // PERCENTAGE, FIXED, BOGO, CLEARANCE, FLASH_SALE

    private String couponCode;

    private boolean active = true;
}
