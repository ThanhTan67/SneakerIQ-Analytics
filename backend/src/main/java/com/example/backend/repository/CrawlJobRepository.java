package com.example.backend.repository;

import com.example.backend.entity.CrawlJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrawlJobRepository extends JpaRepository<CrawlJob, UUID> {

    List<CrawlJob> findByStatusOrderByCreatedAtDesc(String status);

    List<CrawlJob> findBySourceNameOrderByCreatedAtDesc(String sourceName);

    List<CrawlJob> findTop20ByOrderByCreatedAtDesc();

    boolean existsBySourceNameAndStatus(String sourceName, String status);
}
