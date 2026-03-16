package com.example.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "discounts")
public class Discount extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_type_id", nullable = false)
    private DiscountType discountType;
    private LocalDate dateOfCreate;
    private String code;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Category category;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Variants variant;
    private int quantity;
    private int discountPercent;
    private BigDecimal discountValue;
    private BigDecimal minimumOrder;
    private BigDecimal maximumOrder;
    private LocalDate startDate;
    private LocalDate endDate;
    private int usageLimit;
    private boolean isActive;

}
