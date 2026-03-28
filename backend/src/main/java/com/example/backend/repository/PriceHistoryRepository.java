package com.example.backend.repository;

import com.example.backend.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, UUID> {

    List<PriceHistory> findByProductIdOrderBySnapshotDateAsc(UUID productId);

    @Query("SELECT ph FROM PriceHistory ph WHERE ph.product.id = :productId " +
           "AND ph.snapshotDate >= :startDate ORDER BY ph.snapshotDate ASC")
    List<PriceHistory> findByProductIdAndDateRange(
            @Param("productId") UUID productId,
            @Param("startDate") LocalDate startDate
    );

    @Query("SELECT ph FROM PriceHistory ph WHERE ph.product.id = :productId " +
           "ORDER BY ph.snapshotDate DESC LIMIT 1")
    PriceHistory findLatestByProductId(@Param("productId") UUID productId);

    @Query("SELECT ph FROM PriceHistory ph WHERE ph.product.brand.slug = :brandSlug " +
           "AND ph.snapshotDate >= :startDate ORDER BY ph.snapshotDate ASC")
    List<PriceHistory> findByBrandAndDateRange(
            @Param("brandSlug") String brandSlug,
            @Param("startDate") LocalDate startDate
    );
}
