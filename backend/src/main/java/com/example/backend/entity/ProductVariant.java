package com.example.backend.entity;

import com.example.backend.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "product_variants")
public class ProductVariant extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private String size;

    private String colorway;

    private String image;

    @Enumerated(EnumType.STRING)
    private ProductStatus stockStatus = ProductStatus.AVAILABLE;

    private String sourceSku;

    private BigDecimal price;
}
