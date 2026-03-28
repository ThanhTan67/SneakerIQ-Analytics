package com.example.backend.service;

import com.example.backend.entity.CrawlJob;
import com.example.backend.entity.RawCrawlData;
import com.example.backend.repository.CrawlJobRepository;
import com.example.backend.repository.RawCrawlDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Orchestrates the crawl lifecycle:
 *   1. Creates crawl jobs
 *   2. Receives raw data from the Python crawl service
 *   3. Triggers ETL processing
 *   4. Tracks job status
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CrawlOrchestrationService {

    private final CrawlJobRepository crawlJobRepository;
    private final RawCrawlDataRepository rawCrawlDataRepository;
    private final DataMergeService dataMergeService;
    private final InsightCalculationService insightCalculationService;

    /**
     * Start a new crawl job for a source.
     */
    @Transactional
    public CrawlJob startCrawlJob(String sourceName, String jobType) {
        // Check if there's already a running job for this source
        if (crawlJobRepository.existsBySourceNameAndStatus(sourceName, "RUNNING")) {
            throw new IllegalStateException("Crawl job already running for source: " + sourceName);
        }

        CrawlJob job = new CrawlJob();
        job.setSourceName(sourceName);
        job.setJobType(jobType);
        job.markRunning();
        return crawlJobRepository.save(job);
    }

    /**
     * Ingest raw data from the Python crawl service.
     * This is called via POST /api/crawl/ingest
     */
    @Transactional
    public RawCrawlData ingestRawData(UUID crawlJobId, String sourceName, String sourceType,
                                       String sourceUrl, String externalId,
                                       String rawJson, String dataType) {
        RawCrawlData raw = new RawCrawlData();
        raw.setSourceName(sourceName);
        raw.setSourceType(sourceType);
        raw.setSourceUrl(sourceUrl);
        raw.setExternalId(externalId);
        raw.setRawJson(rawJson);
        raw.setDataType(dataType);
        raw.setStatus("PENDING");
        raw.setCollectedAt(Instant.now());

        if (crawlJobId != null) {
            crawlJobRepository.findById(crawlJobId).ifPresent(job -> {
                raw.setCrawlJob(job);
                job.setItemsFound(job.getItemsFound() + 1);
                crawlJobRepository.save(job);
            });
        }

        return rawCrawlDataRepository.save(raw);
    }

    /**
     * Batch ingest multiple raw data items.
     */
    @Transactional
    public int ingestBatch(UUID crawlJobId, List<Map<String, String>> items) {
        int count = 0;
        for (Map<String, String> item : items) {
            ingestRawData(
                    crawlJobId,
                    item.get("sourceName"),
                    item.get("sourceType"),
                    item.get("sourceUrl"),
                    item.get("externalId"),
                    item.get("rawJson"),
                    item.get("dataType")
            );
            count++;
        }
        return count;
    }

    /**
     * Process all pending data and recalculate insights.
     * This is the main ETL entry point.
     */
    @Transactional
    public Map<String, Object> runETLPipeline() {
        log.info("Starting ETL pipeline...");

        // Step 1: Process pending raw data
        int processed = dataMergeService.processPendingData();

        // Step 2: Recalculate insights
        int insights = insightCalculationService.recalculateAllInsights();

        log.info("ETL pipeline complete. Processed: {}, Insights recalculated: {}", processed, insights);
        return Map.of(
                "processedItems", processed,
                "insightsRecalculated", insights,
                "timestamp", Instant.now().toString()
        );
    }

    /**
     * Complete a crawl job.
     */
    @Transactional
    public void completeCrawlJob(UUID jobId, int itemsProcessed, int itemsError) {
        crawlJobRepository.findById(jobId).ifPresent(job -> {
            job.setItemsProcessed(itemsProcessed);
            job.setItemsError(itemsError);
            job.markCompleted();
            crawlJobRepository.save(job);
        });
    }

    /**
     * Fail a crawl job.
     */
    @Transactional
    public void failCrawlJob(UUID jobId, String errorMsg) {
        crawlJobRepository.findById(jobId).ifPresent(job -> {
            job.markFailed(errorMsg);
            crawlJobRepository.save(job);
        });
    }

    /**
     * Get recent crawl jobs.
     */
    public List<CrawlJob> getRecentJobs() {
        return crawlJobRepository.findTop20ByOrderByCreatedAtDesc();
    }

    /**
     * Get crawl statistics.
     */
    public Map<String, Object> getCrawlStats() {
        long pendingCount = rawCrawlDataRepository.countByStatus("PENDING");
        long processedCount = rawCrawlDataRepository.countByStatus("PROCESSED");
        long errorCount = rawCrawlDataRepository.countByStatus("ERROR");

        return Map.of(
                "pending", pendingCount,
                "processed", processedCount,
                "errors", errorCount,
                "total", pendingCount + processedCount + errorCount
        );
    }
}
