package com.example.backend.controller;

import com.example.backend.dto.ProductDto;
import com.example.backend.dto.PriceHistoryDto;
import com.example.backend.repository.BrandRepository;
import com.example.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final BrandRepository brandRepository;

    @GetMapping
    public ResponseEntity<Page<ProductDto>> searchProducts(
            @RequestParam(required = false) UUID brandId,
            @RequestParam(required = false) String brandSlug,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        // Resolve brandSlug to brandId if provided
        UUID resolvedBrandId = brandId;
        if (resolvedBrandId == null && brandSlug != null && !brandSlug.isEmpty()) {
            resolvedBrandId = brandRepository.findBySlug(brandSlug)
                    .map(b -> b.getId())
                    .orElse(null);
        }
        return ResponseEntity.ok(productService.searchProducts(
                resolvedBrandId, gender, minPrice, maxPrice, search, sortBy, sortDir, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<ProductDto>> getTrending(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(productService.getTrendingProducts(limit));
    }

    @GetMapping("/new-arrivals")
    public ResponseEntity<List<ProductDto>> getNewArrivals(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(productService.getNewArrivals(limit));
    }

    @GetMapping("/top-discounted")
    public ResponseEntity<List<ProductDto>> getTopDiscounted(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(productService.getTopDiscounted(limit));
    }

    @GetMapping("/best-deals")
    public ResponseEntity<List<ProductDto>> getBestDeals(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(productService.getBestDeals(limit));
    }

    @GetMapping("/{id}/price-history")
    public ResponseEntity<List<PriceHistoryDto>> getPriceHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "90") int days) {
        return ResponseEntity.ok(productService.getPriceHistory(id, days));
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<ProductDto>> getSimilarProducts(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getSimilarProducts(id, limit));
    }

    @GetMapping("/compare")
    public ResponseEntity<List<ProductDto>> compareProducts(
            @RequestParam List<UUID> ids) {
        return ResponseEntity.ok(productService.compareProducts(ids));
    }
}
