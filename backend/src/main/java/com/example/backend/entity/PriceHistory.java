package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "price_history")
public class PriceHistory extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id")
    private DataSource source;

    @Column(nullable = false)
    private BigDecimal price;

    private BigDecimal previousPrice;

    private BigDecimal priceDiff;

    private BigDecimal priceDiffPercent;

    @Column(nullable = false)
    private LocalDate snapshotDate;
}
