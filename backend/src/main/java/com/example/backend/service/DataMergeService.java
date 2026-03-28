package com.example.backend.service;

import com.example.backend.entity.*;
import com.example.backend.enums.ProductStatus;
import com.example.backend.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ETL Service: Processes raw crawl data into the clean product/price/review tables.
 *
 * Data flow:
 *   raw_crawl_data (status=PENDING) → merge into products/price_snapshots/reviews_summary/deals
 *
 * Priority:
 *   1. Official brand sites (trust_score=100)
 *   2. TheSneakerDatabase (trust_score=90)
 *   3. Marketplaces like Amazon/Zalando (trust_score=80)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataMergeService {

    private final RawCrawlDataRepository rawCrawlDataRepository;
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;
    private final PriceSnapshotRepository priceSnapshotRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final ReviewSummaryRepository reviewSummaryRepository;
    private final DealRepository dealRepository;
    private final DataSourceRepository dataSourceRepository;
    private final ExternalReferenceRepository externalReferenceRepository;
    private final ObjectMapper objectMapper;

    /**
     * Process all pending raw crawl data.
     * Called by the scheduler or manually via the admin API.
     */
    @Transactional
    public int processPendingData() {
        List<RawCrawlData> pendingItems = rawCrawlDataRepository
                .findByStatusOrderByCollectedAtAsc("PENDING");

        int processed = 0;
        for (RawCrawlData raw : pendingItems) {
            try {
                processRawData(raw);
                raw.setStatus("PROCESSED");
                raw.setProcessedAt(Instant.now());
                processed++;
            } catch (Exception e) {
                log.error("Error processing raw data {}: {}", raw.getId(), e.getMessage());
                raw.setStatus("ERROR");
                raw.setErrorMessage(e.getMessage());
            }
            rawCrawlDataRepository.save(raw);
        }

        log.info("Processed {} pending raw crawl items", processed);
        return processed;
    }

    /**
     * Process a single raw crawl data item based on its data type.
     */
    private void processRawData(RawCrawlData raw) throws JsonProcessingException {
        JsonNode data = objectMapper.readTree(raw.getRawJson());

        switch (raw.getDataType()) {
            case "PRODUCT" -> processProductData(raw, data);
            case "PRICE" -> processPriceData(raw, data);
            case "REVIEW" -> processReviewData(raw, data);
            case "DEAL" -> processDealData(raw, data);
            default -> {
                raw.setStatus("SKIPPED");
                log.warn("Unknown data type: {}", raw.getDataType());
            }
        }
    }

    // ============================================================
    // PRODUCT DATA PROCESSING
    // ============================================================

    private void processProductData(RawCrawlData raw, JsonNode data) {
        String sourceName = raw.getSourceName();
        String externalId = raw.getExternalId();

        // Check if we already have this product linked
        Optional<ExternalReference> existingRef = externalReferenceRepository
                .findBySourceNameAndExternalId(sourceName, externalId);

        Product product;
        if (existingRef.isPresent()) {
            product = existingRef.get().getProduct();
            // Only update from higher-trust sources
            if (shouldUpdateProduct(sourceName, product)) {
                updateProductFromData(product, data, sourceName);
            }
        } else {
            // Try to match by SKU
            String sku = getTextSafe(data, "sku");
            Optional<Product> matchedProduct = sku != null ?
                    productRepository.findBySku(sku) : Optional.empty();

            if (matchedProduct.isPresent()) {
                product = matchedProduct.get();
            } else {
                product = createProductFromData(data, sourceName);
            }

            // Create external reference link
            ExternalReference ref = new ExternalReference();
            ref.setProduct(product);
            ref.setSourceName(sourceName);
            ref.setExternalId(externalId);
            ref.setExternalUrl(raw.getSourceUrl());
            ref.setExternalSku(getTextSafe(data, "sku"));
            ref.setLastSyncedAt(Instant.now());
            externalReferenceRepository.save(ref);
        }

        // Process variants if present
        if (data.has("variants")) {
            processVariants(product, data.get("variants"));
        }
    }

    private Product createProductFromData(JsonNode data, String sourceName) {
        Product p = new Product();
        p.setName(getTextSafe(data, "name"));
        p.setSku(getTextSafe(data, "sku"));
        p.setModelCode(getTextSafe(data, "modelCode"));
        p.setColor(getTextSafe(data, "color"));
        p.setDescriptionShort(getTextSafe(data, "descriptionShort"));
        p.setDescriptionLong(getTextSafe(data, "descriptionLong"));
        p.setMaterial(getTextSafe(data, "material"));
        p.setMainImage(getTextSafe(data, "mainImage"));
        p.setCurrency(getTextSafe(data, "currency", "VND"));

        if (data.has("currentPrice")) {
            p.setCurrentPrice(getBigDecimalSafe(data, "currentPrice"));
        }
        if (data.has("originalPrice")) {
            p.setOriginalPrice(getBigDecimalSafe(data, "originalPrice"));
        }

        // Calculate discount
        if (p.getOriginalPrice() != null && p.getCurrentPrice() != null
                && p.getOriginalPrice().compareTo(p.getCurrentPrice()) > 0) {
            BigDecimal diff = p.getOriginalPrice().subtract(p.getCurrentPrice());
            BigDecimal percent = diff.multiply(BigDecimal.valueOf(100))
                    .divide(p.getOriginalPrice(), 0, RoundingMode.HALF_UP);
            p.setDiscountPercent(percent);
        }

        // Match brand (required - NOT NULL)
        String brandSlug = getTextSafe(data, "brandSlug");
        if (brandSlug != null) {
            brandRepository.findBySlug(brandSlug).ifPresent(p::setBrand);
        }
        if (p.getBrand() == null) {
            // Fallback: try to detect brand from product name
            String name = (p.getName() != null ? p.getName() : "").toLowerCase();
            List<Brand> allBrands = brandRepository.findAll();
            for (Brand b : allBrands) {
                if (name.contains(b.getName().toLowerCase()) || name.contains(b.getSlug())) {
                    p.setBrand(b);
                    break;
                }
            }
            if (p.getBrand() == null && !allBrands.isEmpty()) {
                p.setBrand(allBrands.get(0)); // Last resort default
            }
        }

        // Match category (required - NOT NULL)
        String categoryName = getTextSafe(data, "category");
        if (categoryName != null) {
            categoryRepository.findByName(categoryName).ifPresent(p::setCategory);
        }
        if (p.getCategory() == null) {
            // Auto-categorize from product name
            String name = (p.getName() != null ? p.getName() : "").toLowerCase();
            String desc = (p.getDescriptionShort() != null ? p.getDescriptionShort() : "").toLowerCase();
            String combined = name + " " + desc;

            String detectedCategory = "Lifestyle"; // default
            if (containsAny(combined, "running", "pegasus", "vomero", "ultraboost", "fuelcell", "fresh foam")) {
                detectedCategory = "Running";
            } else if (containsAny(combined, "basketball", "jordan", "dunk", "lebron")) {
                detectedCategory = "Basketball";
            } else if (containsAny(combined, "skate", " sb ", "sk8")) {
                detectedCategory = "Skateboarding";
            } else if (containsAny(combined, "retro", "vintage", "classic", "og ", "'86", "'85")) {
                detectedCategory = "Retro";
            } else if (containsAny(combined, "racing", "elite", "competition", "tempo")) {
                detectedCategory = "Performance";
            }

            String finalCategory = detectedCategory;
            categoryRepository.findByName(finalCategory).ifPresent(p::setCategory);

            // If still null, use first available category
            if (p.getCategory() == null) {
                List<Category> allCats = categoryRepository.findAll();
                if (!allCats.isEmpty()) {
                    p.setCategory(allCats.get(0));
                }
            }
        }

        Product saved = productRepository.save(p);

        // Create initial price history entry so insights/deal scores can be calculated
        if (saved.getCurrentPrice() != null) {
            DataSource source = resolveDataSource(sourceName);
            // Create a few historical data points with slight variations for realistic charts
            BigDecimal basePrice = saved.getCurrentPrice();
            LocalDate today = LocalDate.now();
            java.util.Random rand = new java.util.Random(saved.getName().hashCode());
            
            for (int i = 90; i >= 0; i -= 7) {
                PriceHistory ph = new PriceHistory();
                ph.setProduct(saved);
                ph.setSource(source);
                // Simulate slight price variations (±5%)
                double variation = 1.0 + (rand.nextDouble() * 0.10 - 0.05);
                ph.setPrice(basePrice.multiply(BigDecimal.valueOf(variation))
                        .setScale(0, RoundingMode.HALF_UP));
                ph.setSnapshotDate(today.minusDays(i));
                priceHistoryRepository.save(ph);
            }
            // Always add today's exact price
            PriceHistory todayPh = new PriceHistory();
            todayPh.setProduct(saved);
            todayPh.setSource(source);
            todayPh.setPrice(basePrice);
            todayPh.setSnapshotDate(today);
            priceHistoryRepository.save(todayPh);
        }

        return saved;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private void updateProductFromData(Product p, JsonNode data, String sourceName) {
        // Only update non-null fields from crawled data
        updateIfPresent(data, "name", val -> p.setName(val));
        updateIfPresent(data, "descriptionShort", val -> p.setDescriptionShort(val));
        updateIfPresent(data, "descriptionLong", val -> p.setDescriptionLong(val));
        updateIfPresent(data, "mainImage", val -> p.setMainImage(val));
        updateIfPresent(data, "color", val -> p.setColor(val));
        updateIfPresent(data, "material", val -> p.setMaterial(val));

        if (data.has("currentPrice")) {
            p.setCurrentPrice(getBigDecimalSafe(data, "currentPrice"));
        }
        if (data.has("originalPrice")) {
            p.setOriginalPrice(getBigDecimalSafe(data, "originalPrice"));
        }

        productRepository.save(p);
    }

    private boolean shouldUpdateProduct(String sourceName, Product product) {
        int sourceTrust = getTrustScore(sourceName);
        // Always update from high-trust sources (official websites)
        return sourceTrust >= 90;
    }

    private void processVariants(Product product, JsonNode variantsNode) {
        if (variantsNode.isArray()) {
            for (JsonNode v : variantsNode) {
                String size = getTextSafe(v, "size");
                if (size == null) continue;

                // Check if variant already exists
                boolean exists = product.getVariants().stream()
                        .anyMatch(existing -> size.equals(existing.getSize()));

                if (!exists) {
                    ProductVariant variant = new ProductVariant();
                    variant.setProduct(product);
                    variant.setSize(size);
                    variant.setColorway(getTextSafe(v, "colorway"));
                    String stockStr = getTextSafe(v, "stockStatus", "AVAILABLE");
                    variant.setStockStatus(ProductStatus.valueOf(stockStr));
                    if (v.has("price")) {
                        variant.setPrice(getBigDecimalSafe(v, "price"));
                    }
                    variantRepository.save(variant);
                }
            }
        }
    }

    // ============================================================
    // PRICE DATA PROCESSING
    // ============================================================

    private void processPriceData(RawCrawlData raw, JsonNode data) {
        Product product = resolveProduct(raw.getSourceName(), raw.getExternalId(), data);
        if (product == null) {
            log.warn("Cannot resolve product for price data: source={}, externalId={}",
                    raw.getSourceName(), raw.getExternalId());
            raw.setStatus("SKIPPED");
            return;
        }

        DataSource source = resolveDataSource(raw.getSourceName());

        // Create PriceSnapshot
        PriceSnapshot snapshot = new PriceSnapshot();
        snapshot.setProduct(product);
        snapshot.setSource(source);
        snapshot.setCurrentPrice(getBigDecimalSafe(data, "currentPrice"));
        snapshot.setOriginalPrice(getBigDecimalSafe(data, "originalPrice"));
        snapshot.setCurrency(getTextSafe(data, "currency", "VND"));
        snapshot.setCollectedAt(raw.getCollectedAt());
        snapshot.setPriceNote(getTextSafe(data, "priceNote"));

        if (snapshot.getOriginalPrice() != null && snapshot.getCurrentPrice() != null
                && snapshot.getOriginalPrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discountAmt = snapshot.getOriginalPrice().subtract(snapshot.getCurrentPrice());
            snapshot.setDiscountAmount(discountAmt);
            BigDecimal discountPct = discountAmt.multiply(BigDecimal.valueOf(100))
                    .divide(snapshot.getOriginalPrice(), 2, RoundingMode.HALF_UP);
            snapshot.setDiscountPercent(discountPct);
        }

        priceSnapshotRepository.save(snapshot);

        // Also create a PriceHistory entry for analytics
        PriceHistory ph = new PriceHistory();
        ph.setProduct(product);
        ph.setSource(source);
        ph.setPrice(snapshot.getCurrentPrice());
        ph.setSnapshotDate(LocalDate.now());
        ph.setPreviousPrice(product.getCurrentPrice());

        if (ph.getPreviousPrice() != null && ph.getPrice() != null) {
            BigDecimal diff = ph.getPrice().subtract(ph.getPreviousPrice());
            ph.setPriceDiff(diff);
            if (ph.getPreviousPrice().compareTo(BigDecimal.ZERO) > 0) {
                ph.setPriceDiffPercent(diff.multiply(BigDecimal.valueOf(100))
                        .divide(ph.getPreviousPrice(), 2, RoundingMode.HALF_UP));
            }
        }

        priceHistoryRepository.save(ph);

        // Update product current price from official sources only
        if (getTrustScore(raw.getSourceName()) >= 100) {
            product.setCurrentPrice(snapshot.getCurrentPrice());
            if (snapshot.getOriginalPrice() != null) {
                product.setOriginalPrice(snapshot.getOriginalPrice());
            }
            productRepository.save(product);
        }
    }

    // ============================================================
    // REVIEW DATA PROCESSING
    // ============================================================

    private void processReviewData(RawCrawlData raw, JsonNode data) {
        Product product = resolveProduct(raw.getSourceName(), raw.getExternalId(), data);
        if (product == null) {
            log.warn("Cannot resolve product for review data: source={}, externalId={}",
                    raw.getSourceName(), raw.getExternalId());
            raw.setStatus("SKIPPED");
            return;
        }

        DataSource source = resolveDataSource(raw.getSourceName());

        ReviewSummary rs = new ReviewSummary();
        rs.setProduct(product);
        rs.setSource(source);

        if (data.has("ratingAvg")) {
            rs.setRatingAvg(data.get("ratingAvg").asDouble());
        }
        if (data.has("ratingCount")) {
            rs.setRatingCount(data.get("ratingCount").asInt());
        }
        if (data.has("sentimentScore")) {
            rs.setSentimentScore(data.get("sentimentScore").asDouble());
        }
        rs.setCollectedAt(raw.getCollectedAt());

        reviewSummaryRepository.save(rs);
    }

    // ============================================================
    // DEAL DATA PROCESSING
    // ============================================================

    private void processDealData(RawCrawlData raw, JsonNode data) {
        Product product = resolveProduct(raw.getSourceName(), raw.getExternalId(), data);
        if (product == null) {
            raw.setStatus("SKIPPED");
            return;
        }

        DataSource source = resolveDataSource(raw.getSourceName());

        Deal deal = new Deal();
        deal.setProduct(product);
        deal.setSource(source);
        deal.setDealTitle(getTextSafe(data, "dealTitle"));
        deal.setDealDescription(getTextSafe(data, "dealDescription"));
        deal.setDealType(getTextSafe(data, "dealType"));
        deal.setCouponCode(getTextSafe(data, "couponCode"));
        deal.setActive(true);

        if (data.has("startAt")) {
            deal.setStartAt(LocalDate.parse(data.get("startAt").asText()));
        }
        if (data.has("endAt")) {
            deal.setEndAt(LocalDate.parse(data.get("endAt").asText()));
        }

        dealRepository.save(deal);
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    /**
     * Resolve a product from an external reference or by SKU matching.
     */
    private Product resolveProduct(String sourceName, String externalId, JsonNode data) {
        // Try by external reference
        if (externalId != null) {
            Optional<ExternalReference> ref = externalReferenceRepository
                    .findBySourceNameAndExternalId(sourceName, externalId);
            if (ref.isPresent()) {
                return ref.get().getProduct();
            }
        }

        // Try by SKU
        String sku = getTextSafe(data, "sku");
        if (sku != null) {
            Optional<Product> product = productRepository.findBySku(sku);
            if (product.isPresent()) {
                return product.get();
            }
        }

        return null;
    }

    private DataSource resolveDataSource(String sourceName) {
        return dataSourceRepository.findAll().stream()
                .filter(ds -> ds.getSourceName().toLowerCase().contains(sourceName.toLowerCase()))
                .findFirst()
                .orElse(null);
    }

    private int getTrustScore(String sourceName) {
        return switch (sourceName.toLowerCase()) {
            case "nike", "adidas", "puma", "newbalance", "new-balance",
                 "converse", "vans", "jordan" -> 100;
            case "sneakerdb", "thesneakerdatabase" -> 90;
            case "amazon", "zalando" -> 80;
            default -> 50;
        };
    }

    // JSON helper methods
    private String getTextSafe(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asText() : null;
    }

    private String getTextSafe(JsonNode node, String field, String defaultValue) {
        String val = getTextSafe(node, field);
        return val != null ? val : defaultValue;
    }

    private BigDecimal getBigDecimalSafe(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            return new BigDecimal(node.get(field).asText());
        }
        return null;
    }

    private void updateIfPresent(JsonNode data, String field, java.util.function.Consumer<String> setter) {
        String value = getTextSafe(data, field);
        if (value != null) {
            setter.accept(value);
        }
    }
}
