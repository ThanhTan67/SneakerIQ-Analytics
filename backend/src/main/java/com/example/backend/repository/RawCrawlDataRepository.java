package com.example.backend.repository;

import com.example.backend.entity.RawCrawlData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RawCrawlDataRepository extends JpaRepository<RawCrawlData, UUID> {

    List<RawCrawlData> findByStatusOrderByCollectedAtAsc(String status);

    List<RawCrawlData> findByStatusAndDataTypeOrderByCollectedAtAsc(String status, String dataType);

    List<RawCrawlData> findBySourceNameAndExternalId(String sourceName, String externalId);

    long countByStatus(String status);

    long countBySourceNameAndStatus(String sourceName, String status);
}
