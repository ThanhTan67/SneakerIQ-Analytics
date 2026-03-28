package com.example.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class BrandDto {
    private UUID id;
    private String name;
    private String slug;
    private String logo;
    private String description;
    private long productCount;
    private BigDecimal avgPrice;
    private BigDecimal avgDiscount;
}
