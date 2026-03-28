package com.example.backend.scheduler;

import com.example.backend.service.CrawlOrchestrationService;
import com.example.backend.service.InsightCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for the crawl pipeline.
 *
 * Schedules:
 *   - ETL processing: every 30 minutes (process any pending raw data)
 *   - Insight recalculation: every 6 hours
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CrawlScheduler {

    private final CrawlOrchestrationService crawlService;
    private final InsightCalculationService insightService;

    /**
     * Process pending raw crawl data every 30 minutes.
     */
    @Scheduled(fixedDelay = 1800000) // 30 minutes
    public void processRawData() {
        try {
            log.info("[Scheduler] Processing pending raw crawl data...");
            crawlService.runETLPipeline();
        } catch (Exception e) {
            log.error("[Scheduler] Error processing raw data: {}", e.getMessage());
        }
    }

    /**
     * Full insight recalculation every 6 hours.
     */
    @Scheduled(fixedDelay = 21600000) // 6 hours
    public void recalculateInsights() {
        try {
            log.info("[Scheduler] Recalculating all product insights...");
            int count = insightService.recalculateAllInsights();
            log.info("[Scheduler] Recalculated {} product insights", count);
        } catch (Exception e) {
            log.error("[Scheduler] Error recalculating insights: {}", e.getMessage());
        }
    }
}
