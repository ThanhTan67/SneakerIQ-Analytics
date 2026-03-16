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
@Table(name = "variants")
public class Variants extends BaseEntity {
    @Column(name = "sku", nullable = false, unique = true)
    private String sku;
    private String description;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @ManyToOne
    @JoinColumn(name = "quantity_id")
    private Quantity quantity;
    private String color;
    private String size;
    private BigDecimal price;
    private BigDecimal discountPercent;
    private int view;
    @Enumerated(EnumType.STRING)
    private ProductStatus status;

}
