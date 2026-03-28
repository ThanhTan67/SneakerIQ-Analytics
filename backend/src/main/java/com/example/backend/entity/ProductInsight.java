package com.example.backend.entity;

import com.example.backend.enums.TrendStatus;
import com.example.backend.enums.RecommendationLabel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "product_insights")
public class ProductInsight extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    private BigDecimal bestPrice;

    private BigDecimal worstPrice;

    private BigDecimal avgPrice;

    @Enumerated(EnumType.STRING)
    private TrendStatus trendStatus;

    private int dealScore; // 0-100

    @Enumerated(EnumType.STRING)
    private RecommendationLabel recommendationLabel;

    private BigDecimal priceChange7d;

    private BigDecimal priceChange30d;

    private BigDecimal volatility;
}
