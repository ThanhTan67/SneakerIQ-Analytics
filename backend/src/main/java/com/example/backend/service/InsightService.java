package com.example.backend.service;

import com.example.backend.dto.InsightDto;
import com.example.backend.entity.ProductInsight;
import com.example.backend.repository.ProductInsightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InsightService {

    private final ProductInsightRepository insightRepository;

    public List<InsightDto> getTopDeals(int limit) {
        return insightRepository.findTopDeals(PageRequest.of(0, limit))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<InsightDto> getTopDealsByBrand(String brandSlug, int limit) {
        return insightRepository.findTopDealsByBrand(brandSlug, PageRequest.of(0, limit))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private InsightDto toDto(ProductInsight pi) {
        InsightDto dto = new InsightDto();
        dto.setProductId(pi.getProduct().getId());
        dto.setProductName(pi.getProduct().getName());
        dto.setBrandName(pi.getProduct().getBrand().getName());
        dto.setBrandSlug(pi.getProduct().getBrand().getSlug());
        dto.setMainImage(pi.getProduct().getMainImage());
        dto.setCurrentPrice(pi.getProduct().getCurrentPrice());
        dto.setBestPrice(pi.getBestPrice());
        dto.setWorstPrice(pi.getWorstPrice());
        dto.setAvgPrice(pi.getAvgPrice());
        dto.setTrendStatus(pi.getTrendStatus());
        dto.setDealScore(pi.getDealScore());
        dto.setRecommendationLabel(pi.getRecommendationLabel());
        dto.setPriceChange7d(pi.getPriceChange7d());
        dto.setPriceChange30d(pi.getPriceChange30d());
        dto.setVolatility(pi.getVolatility());
        dto.setDiscountPercent(pi.getProduct().getDiscountPercent());
        return dto;
    }
}
