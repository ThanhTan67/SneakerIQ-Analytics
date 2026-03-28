package com.example.backend.controller;

import com.example.backend.dto.InsightDto;
import com.example.backend.service.InsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/insights")
@RequiredArgsConstructor
public class InsightController {

    private final InsightService insightService;

    @GetMapping("/top-deals")
    public ResponseEntity<List<InsightDto>> getTopDeals(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(insightService.getTopDeals(limit));
    }

    @GetMapping("/top-deals/{brandSlug}")
    public ResponseEntity<List<InsightDto>> getTopDealsByBrand(
            @PathVariable String brandSlug,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(insightService.getTopDealsByBrand(brandSlug, limit));
    }
}
