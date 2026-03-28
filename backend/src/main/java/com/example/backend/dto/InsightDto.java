package com.example.backend.dto;

import com.example.backend.enums.RecommendationLabel;
import com.example.backend.enums.TrendStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class InsightDto {
    private UUID productId;
    private String productName;
    private String brandName;
    private String brandSlug;
    private String mainImage;
    private BigDecimal currentPrice;
    private BigDecimal bestPrice;
    private BigDecimal worstPrice;
    private BigDecimal avgPrice;
    private TrendStatus trendStatus;
    private int dealScore;
    private RecommendationLabel recommendationLabel;
    private BigDecimal priceChange7d;
    private BigDecimal priceChange30d;
    private BigDecimal volatility;
    private BigDecimal discountPercent;
}
