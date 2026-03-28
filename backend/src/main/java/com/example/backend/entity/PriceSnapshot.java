package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "price_snapshots")
public class PriceSnapshot extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id")
    private DataSource source;

    @Column(nullable = false)
    private BigDecimal currentPrice;

    private BigDecimal originalPrice;

    private String currency = "VND";

    private BigDecimal discountAmount;

    private BigDecimal discountPercent;

    @Column(nullable = false)
    private Instant collectedAt;

    private String priceNote; // e.g., "sale price", "outlet price", "member price"
}
