package com.example.backend.repository;

import com.example.backend.entity.PriceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface PriceSnapshotRepository extends JpaRepository<PriceSnapshot, UUID> {

    List<PriceSnapshot> findByProductIdOrderByCollectedAtDesc(UUID productId);

    List<PriceSnapshot> findByProductIdAndCollectedAtAfterOrderByCollectedAtAsc(UUID productId, Instant after);

    List<PriceSnapshot> findByProductIdAndSourceIdOrderByCollectedAtDesc(UUID productId, UUID sourceId);
}
