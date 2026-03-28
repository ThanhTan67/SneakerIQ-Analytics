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
@Table(name = "crawl_jobs")
public class CrawlJob extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String sourceName; // 'nike', 'adidas', 'amazon', etc.

    @Column(nullable = false, length = 50)
    private String jobType; // FULL_CRAWL, INCREMENTAL, REVIEW_ONLY, PRICE_ONLY

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, RUNNING, COMPLETED, FAILED

    private int itemsFound;

    private int itemsProcessed;

    private int itemsError;

    private Instant startedAt;

    private Instant completedAt;

    @Column(columnDefinition = "TEXT")
    private String errorLog;

    public void markRunning() {
        this.status = "RUNNING";
        this.startedAt = Instant.now();
    }

    public void markCompleted() {
        this.status = "COMPLETED";
        this.completedAt = Instant.now();
    }

    public void markFailed(String error) {
        this.status = "FAILED";
        this.completedAt = Instant.now();
        this.errorLog = error;
    }
}
