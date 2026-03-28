package com.example.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PriceHistoryDto {
    private LocalDate date;
    private BigDecimal price;
    private BigDecimal previousPrice;
    private BigDecimal priceDiff;
    private BigDecimal priceDiffPercent;
    private String sourceName;
}
