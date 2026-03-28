package com.example.backend.entity;

import com.example.backend.enums.GenderOptions;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "products")
public class Product extends BaseEntity {
    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String sku;

    private String modelCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    private GenderOptions gender;

    private String color;

    @Column(columnDefinition = "TEXT")
    private String descriptionShort;

    @Column(columnDefinition = "TEXT")
    private String descriptionLong;

    private String mainImage;

    private String material;

    private BigDecimal currentPrice;

    private BigDecimal originalPrice;

    private BigDecimal discountPercent;

    @Column(nullable = false)
    private String currency = "VND";

    private int viewCount;

    private boolean trending;

    private boolean newArrival;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PriceHistory> priceHistories = new ArrayList<>();

    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ProductInsight insight;
}
