package com.example.backend.controller;

import com.example.backend.dto.BrandDto;
import com.example.backend.dto.ProductDto;
import com.example.backend.service.BrandService;
import com.example.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<BrandDto>> getAllBrands() {
        return ResponseEntity.ok(brandService.getAllBrands());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<BrandDto> getBrand(@PathVariable String slug) {
        return ResponseEntity.ok(brandService.getBrandBySlug(slug));
    }

    @GetMapping("/{slug}/best-deals")
    public ResponseEntity<List<ProductDto>> getBrandBestDeals(
            @PathVariable String slug,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(productService.getBestDealsByBrand(slug, limit));
    }
}
