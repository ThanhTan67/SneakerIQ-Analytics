package com.example.backend.dto;

import com.example.backend.enums.GenderOptions;
import com.example.backend.enums.RecommendationLabel;
import com.example.backend.enums.TrendStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ProductDto {
    private UUID id;
    private String name;
    private String sku;
    private String modelCode;
    private String brandName;
    private String brandSlug;
    private String categoryName;
    private GenderOptions gender;
    private String color;
    private String descriptionShort;
    private String descriptionLong;
    private String mainImage;
    private String material;
    private BigDecimal currentPrice;
    private BigDecimal originalPrice;
    private BigDecimal discountPercent;
    private String currency;
    private int viewCount;
    private boolean trending;
    private boolean newArrival;

    // Insight data
    private BigDecimal bestPrice;
    private BigDecimal worstPrice;
    private BigDecimal avgPrice;
    private TrendStatus trendStatus;
    private int dealScore;
    private RecommendationLabel recommendationLabel;
    private BigDecimal priceChange7d;
    private BigDecimal priceChange30d;

    // Review data
    private Double ratingAvg;
    private Integer reviewCount;

    // Variants
    private List<VariantDto> variants;

    // Deals
    private List<DealDto> activeDeals;

    @Data
    public static class VariantDto {
        private UUID id;
        private String size;
        private String colorway;
        private String image;
        private String stockStatus;
        private BigDecimal price;
    }

    @Data
    public static class DealDto {
        private UUID id;
        private String dealTitle;
        private String dealDescription;
        private String dealType;
        private String couponCode;
        private String startAt;
        private String endAt;
    }
}
