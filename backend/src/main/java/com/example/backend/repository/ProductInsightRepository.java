package com.example.backend.repository;

import com.example.backend.entity.ProductInsight;
import com.example.backend.enums.RecommendationLabel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductInsightRepository extends JpaRepository<ProductInsight, UUID> {

    Optional<ProductInsight> findByProductId(UUID productId);

    @Query("SELECT pi FROM ProductInsight pi ORDER BY pi.dealScore DESC")
    List<ProductInsight> findTopDeals(Pageable pageable);

    @Query("SELECT pi FROM ProductInsight pi WHERE pi.recommendationLabel = :label")
    List<ProductInsight> findByRecommendation(@Param("label") RecommendationLabel label, Pageable pageable);

    @Query("SELECT pi FROM ProductInsight pi WHERE pi.product.brand.slug = :brandSlug ORDER BY pi.dealScore DESC")
    List<ProductInsight> findTopDealsByBrand(@Param("brandSlug") String brandSlug, Pageable pageable);
}
