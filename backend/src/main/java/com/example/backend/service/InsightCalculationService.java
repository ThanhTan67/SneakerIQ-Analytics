package com.example.backend.service;

import com.example.backend.entity.PriceHistory;
import com.example.backend.entity.Product;
import com.example.backend.entity.ProductInsight;
import com.example.backend.enums.RecommendationLabel;
import com.example.backend.enums.TrendStatus;
import com.example.backend.repository.PriceHistoryRepository;
import com.example.backend.repository.ProductInsightRepository;
import com.example.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

/**
 * Calculates product insights based on price history data.
 * Extracted from DataSeeder to be reusable after each ETL cycle.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InsightCalculationService {

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final ProductInsightRepository insightRepository;

    /**
     * Recalculate insights for ALL products.
     */
    @Transactional
    public int recalculateAllInsights() {
        List<Product> products = productRepository.findAll();
        int count = 0;
        for (Product product : products) {
            try {
                calculateInsight(product);
                count++;
            } catch (Exception e) {
                log.error("Error calculating insight for product {}: {}", product.getId(), e.getMessage());
            }
        }
        log.info("Recalculated insights for {} products", count);
        return count;
    }

    /**
     * Recalculate insight for a single product.
     */
    @Transactional
    public ProductInsight calculateInsight(Product product) {
        List<PriceHistory> history = priceHistoryRepository
                .findByProductIdOrderBySnapshotDateAsc(product.getId());

        // Find or create insight
        Optional<ProductInsight> existingInsight = insightRepository.findByProductId(product.getId());
        ProductInsight insight = existingInsight.orElseGet(() -> {
            ProductInsight newInsight = new ProductInsight();
            newInsight.setProduct(product);
            return newInsight;
        });

        if (history.isEmpty()) {
            return insightRepository.save(insight);
        }

        // Calculate price statistics
        BigDecimal min = history.stream()
                .map(PriceHistory::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        BigDecimal max = history.stream()
                .map(PriceHistory::getPrice)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        BigDecimal avg = history.stream()
                .map(PriceHistory::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(history.size()), 0, RoundingMode.HALF_UP);

        insight.setBestPrice(min);
        insight.setWorstPrice(max);
        insight.setAvgPrice(avg);

        // Determine trend
        BigDecimal currentPrice = product.getCurrentPrice();
        if (currentPrice != null && avg.compareTo(BigDecimal.ZERO) > 0) {
            if (currentPrice.compareTo(avg) < 0) {
                insight.setTrendStatus(TrendStatus.FALLING);
            } else if (currentPrice.compareTo(avg) > 0) {
                insight.setTrendStatus(TrendStatus.RISING);
            } else {
                insight.setTrendStatus(TrendStatus.STABLE);
            }

            // Deal score (0-100)
            BigDecimal ratio = currentPrice.divide(avg, 4, RoundingMode.HALF_UP);
            int score = Math.max(0, Math.min(100,
                    (int) ((1.0 - ratio.doubleValue()) * 200 + 50)));
            insight.setDealScore(score);
        }

        // 7d and 30d price changes
        if (currentPrice != null) {
            List<PriceHistory> last7 = history.subList(
                    Math.max(0, history.size() - 7), history.size());
            List<PriceHistory> last30 = history.subList(
                    Math.max(0, history.size() - 30), history.size());

            if (!last7.isEmpty()) {
                BigDecimal change7d = currentPrice.subtract(last7.get(0).getPrice());
                insight.setPriceChange7d(change7d);
            }
            if (!last30.isEmpty()) {
                BigDecimal change30d = currentPrice.subtract(last30.get(0).getPrice());
                insight.setPriceChange30d(change30d);
            }
        }

        // Recommendation label
        if (currentPrice != null && avg.compareTo(BigDecimal.ZERO) > 0) {
            if (currentPrice.compareTo(avg.multiply(BigDecimal.valueOf(0.9))) < 0) {
                insight.setRecommendationLabel(RecommendationLabel.BUY_NOW);
            } else if (currentPrice.compareTo(avg.multiply(BigDecimal.valueOf(0.95))) < 0) {
                insight.setRecommendationLabel(RecommendationLabel.GREAT_DEAL);
            } else if (currentPrice.compareTo(avg) <= 0) {
                insight.setRecommendationLabel(RecommendationLabel.FAIR_PRICE);
            } else if (currentPrice.compareTo(avg.multiply(BigDecimal.valueOf(1.05))) < 0) {
                insight.setRecommendationLabel(RecommendationLabel.WATCH);
            } else {
                insight.setRecommendationLabel(RecommendationLabel.WAIT);
            }
        }

        // Volatility
        double mean = avg.doubleValue();
        double variance = history.stream()
                .mapToDouble(ph -> Math.pow(ph.getPrice().doubleValue() - mean, 2))
                .average().orElse(0);
        insight.setVolatility(BigDecimal.valueOf(Math.sqrt(variance))
                .setScale(0, RoundingMode.HALF_UP));

        return insightRepository.save(insight);
    }
}
