package com.example.backend.service;

import com.example.backend.dto.ProductDto;
import com.example.backend.dto.PriceHistoryDto;
import com.example.backend.entity.*;
import com.example.backend.enums.GenderOptions;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final DealRepository dealRepository;
    private final ReviewSummaryRepository reviewSummaryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductInsightRepository productInsightRepository;

    public Page<ProductDto> searchProducts(UUID brandId, String gender, BigDecimal minPrice,
                                            BigDecimal maxPrice, String search, String sortBy,
                                            String sortDir, int page, int size) {
        GenderOptions genderEnum = null;
        if (gender != null && !gender.isEmpty()) {
            try {
                genderEnum = GenderOptions.valueOf(gender.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir != null ? sortDir : "asc"),
                           sortBy != null ? sortBy : "name");
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> products = productRepository.searchProducts(brandId, genderEnum, minPrice, maxPrice, search, pageable);
        return products.map(this::toDto);
    }

    public ProductDto getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        return toDetailDto(product);
    }

    public Page<ProductDto> getProductsByBrand(String brandSlug, int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir != null ? sortDir : "asc"),
                           sortBy != null ? sortBy : "name");
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findByBrandSlug(brandSlug, pageable).map(this::toDto);
    }

    public List<ProductDto> getTrendingProducts(int limit) {
        return productRepository.findTrendingProducts(PageRequest.of(0, limit))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductDto> getNewArrivals(int limit) {
        return productRepository.findNewArrivals(PageRequest.of(0, limit))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductDto> getTopDiscounted(int limit) {
        return productRepository.findTopDiscounted(PageRequest.of(0, limit))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductDto> getBestDeals(int limit) {
        return productRepository.findBestDeals(60, PageRequest.of(0, limit))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductDto> getBestDealsByBrand(String brandSlug, int limit) {
        return productRepository.findBestDealsByBrand(brandSlug, PageRequest.of(0, limit))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductDto> getSimilarProducts(UUID productId, int limit) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return productRepository.findByBrandSlugAndIdNot(product.getBrand().getSlug(), productId, PageRequest.of(0, limit))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<PriceHistoryDto> getPriceHistory(UUID productId, int days) {
        LocalDate startDate = LocalDate.now().minusDays(days);
        return priceHistoryRepository.findByProductIdAndDateRange(productId, startDate)
                .stream().map(this::toPriceHistoryDto).collect(Collectors.toList());
    }

    public List<ProductDto> compareProducts(List<UUID> productIds) {
        return productIds.stream()
                .map(this::getProductById)
                .collect(Collectors.toList());
    }

    // ======== Mapping methods ========

    private ProductDto toDto(Product p) {
        ProductDto dto = new ProductDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setSku(p.getSku());
        dto.setModelCode(p.getModelCode());
        dto.setBrandName(p.getBrand().getName());
        dto.setBrandSlug(p.getBrand().getSlug());
        if (p.getCategory() != null) dto.setCategoryName(p.getCategory().getName());
        dto.setGender(p.getGender());
        dto.setColor(p.getColor());
        dto.setDescriptionShort(p.getDescriptionShort());
        dto.setMainImage(p.getMainImage());
        dto.setMaterial(p.getMaterial());
        dto.setCurrentPrice(p.getCurrentPrice());
        dto.setOriginalPrice(p.getOriginalPrice());
        dto.setDiscountPercent(p.getDiscountPercent());
        dto.setCurrency(p.getCurrency());
        dto.setViewCount(p.getViewCount());
        dto.setTrending(p.isTrending());
        dto.setNewArrival(p.isNewArrival());

        // Insight
        if (p.getInsight() != null) {
            ProductInsight i = p.getInsight();
            dto.setBestPrice(i.getBestPrice());
            dto.setWorstPrice(i.getWorstPrice());
            dto.setAvgPrice(i.getAvgPrice());
            dto.setTrendStatus(i.getTrendStatus());
            dto.setDealScore(i.getDealScore());
            dto.setRecommendationLabel(i.getRecommendationLabel());
            dto.setPriceChange7d(i.getPriceChange7d());
            dto.setPriceChange30d(i.getPriceChange30d());
        }

        // Review average
        Double avgRating = reviewSummaryRepository.findAverageRatingByProductId(p.getId());
        Integer reviewCount = reviewSummaryRepository.findTotalReviewCountByProductId(p.getId());
        dto.setRatingAvg(avgRating);
        dto.setReviewCount(reviewCount);

        return dto;
    }

    private ProductDto toDetailDto(Product p) {
        ProductDto dto = toDto(p);
        dto.setDescriptionLong(p.getDescriptionLong());

        // Variants
        List<ProductDto.VariantDto> variants = productVariantRepository.findByProductId(p.getId())
                .stream().map(v -> {
                    ProductDto.VariantDto vd = new ProductDto.VariantDto();
                    vd.setId(v.getId());
                    vd.setSize(v.getSize());
                    vd.setColorway(v.getColorway());
                    vd.setImage(v.getImage());
                    vd.setStockStatus(v.getStockStatus() != null ? v.getStockStatus().name() : null);
                    vd.setPrice(v.getPrice());
                    return vd;
                }).collect(Collectors.toList());
        dto.setVariants(variants);

        // Active deals
        List<ProductDto.DealDto> deals = dealRepository.findByProductIdAndActiveTrue(p.getId())
                .stream().map(d -> {
                    ProductDto.DealDto dd = new ProductDto.DealDto();
                    dd.setId(d.getId());
                    dd.setDealTitle(d.getDealTitle());
                    dd.setDealDescription(d.getDealDescription());
                    dd.setDealType(d.getDealType());
                    dd.setCouponCode(d.getCouponCode());
                    if (d.getStartAt() != null) dd.setStartAt(d.getStartAt().toString());
                    if (d.getEndAt() != null) dd.setEndAt(d.getEndAt().toString());
                    return dd;
                }).collect(Collectors.toList());
        dto.setActiveDeals(deals);

        return dto;
    }

    private PriceHistoryDto toPriceHistoryDto(PriceHistory ph) {
        PriceHistoryDto dto = new PriceHistoryDto();
        dto.setDate(ph.getSnapshotDate());
        dto.setPrice(ph.getPrice());
        dto.setPreviousPrice(ph.getPreviousPrice());
        dto.setPriceDiff(ph.getPriceDiff());
        dto.setPriceDiffPercent(ph.getPriceDiffPercent());
        if (ph.getSource() != null) dto.setSourceName(ph.getSource().getSourceName());
        return dto;
    }
}
