package com.example.backend.controller;

import com.example.backend.entity.CrawlJob;
import com.example.backend.service.CrawlOrchestrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST API for managing the data crawl pipeline.
 *
 * Endpoints:
 *   POST /api/crawl/jobs          - Start a new crawl job
 *   POST /api/crawl/ingest        - Ingest a single raw data item
 *   POST /api/crawl/ingest/batch  - Ingest a batch of raw data items
 *   POST /api/crawl/etl           - Trigger ETL pipeline manually
 *   POST /api/crawl/jobs/{id}/complete - Mark job as completed
 *   POST /api/crawl/jobs/{id}/fail    - Mark job as failed
 *   GET  /api/crawl/jobs          - Get recent crawl jobs
 *   GET  /api/crawl/stats         - Get crawl statistics
 */
@RestController
@RequestMapping("/api/crawl")
@RequiredArgsConstructor
public class CrawlController {

    private final CrawlOrchestrationService crawlService;

    // ============================================================
    // JOB MANAGEMENT
    // ============================================================

    @PostMapping("/jobs")
    public ResponseEntity<CrawlJob> startJob(@RequestBody Map<String, String> request) {
        String sourceName = request.get("sourceName");
        String jobType = request.getOrDefault("jobType", "FULL_CRAWL");
        CrawlJob job = crawlService.startCrawlJob(sourceName, jobType);
        return ResponseEntity.ok(job);
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<CrawlJob>> getRecentJobs() {
        return ResponseEntity.ok(crawlService.getRecentJobs());
    }

    @PostMapping("/jobs/{id}/complete")
    public ResponseEntity<Void> completeJob(@PathVariable UUID id,
                                             @RequestBody Map<String, Integer> request) {
        crawlService.completeCrawlJob(id,
                request.getOrDefault("itemsProcessed", 0),
                request.getOrDefault("itemsError", 0));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/jobs/{id}/fail")
    public ResponseEntity<Void> failJob(@PathVariable UUID id,
                                         @RequestBody Map<String, String> request) {
        crawlService.failCrawlJob(id, request.get("error"));
        return ResponseEntity.ok().build();
    }

    // ============================================================
    // DATA INGESTION (called by Python crawl service)
    // ============================================================

    @PostMapping("/ingest")
    public ResponseEntity<Map<String, String>> ingestData(@RequestBody Map<String, String> request) {
        UUID crawlJobId = request.containsKey("crawlJobId") ?
                UUID.fromString(request.get("crawlJobId")) : null;

        var raw = crawlService.ingestRawData(
                crawlJobId,
                request.get("sourceName"),
                request.get("sourceType"),
                request.get("sourceUrl"),
                request.get("externalId"),
                request.get("rawJson"),
                request.get("dataType")
        );

        return ResponseEntity.ok(Map.of(
                "id", raw.getId().toString(),
                "status", raw.getStatus()
        ));
    }

    @PostMapping("/ingest/batch")
    public ResponseEntity<Map<String, Object>> ingestBatch(@RequestBody Map<String, Object> request) {
        UUID crawlJobId = request.containsKey("crawlJobId") ?
                UUID.fromString((String) request.get("crawlJobId")) : null;

        @SuppressWarnings("unchecked")
        List<Map<String, String>> items = (List<Map<String, String>>) request.get("items");

        int count = crawlService.ingestBatch(crawlJobId, items);

        return ResponseEntity.ok(Map.of(
                "ingested", count,
                "status", "OK"
        ));
    }

    // ============================================================
    // ETL PIPELINE
    // ============================================================

    @PostMapping("/etl")
    public ResponseEntity<Map<String, Object>> triggerETL() {
        Map<String, Object> result = crawlService.runETLPipeline();
        return ResponseEntity.ok(result);
    }

    // ============================================================
    // STATISTICS
    // ============================================================

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(crawlService.getCrawlStats());
    }
}
