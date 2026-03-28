package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "raw_crawl_data", indexes = {
    @Index(name = "idx_raw_status", columnList = "status"),
    @Index(name = "idx_raw_source", columnList = "sourceName"),
    @Index(name = "idx_raw_collected", columnList = "collectedAt")
})
public class RawCrawlData extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String sourceName; // 'nike', 'adidas', 'amazon', 'sneakerdb'

    @Column(nullable = false, length = 50)
    private String sourceType; // OFFICIAL, MARKETPLACE, CATALOG

    @Column(columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(length = 255)
    private String externalId; // ID on the original source

    @Column(nullable = false, columnDefinition = "JSON")
    private String rawJson; // Full raw data as JSON

    @Column(nullable = false, length = 50)
    private String dataType; // PRODUCT, REVIEW, PRICE, DEAL

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, PROCESSED, ERROR, SKIPPED

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false)
    private Instant collectedAt;

    private Instant processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crawl_job_id")
    private CrawlJob crawlJob;
}
