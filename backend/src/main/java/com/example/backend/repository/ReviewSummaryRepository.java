package com.example.backend.repository;

import com.example.backend.entity.ReviewSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewSummaryRepository extends JpaRepository<ReviewSummary, UUID> {

    List<ReviewSummary> findByProductId(UUID productId);

    @Query("SELECT AVG(rs.ratingAvg) FROM ReviewSummary rs WHERE rs.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") UUID productId);

    @Query("SELECT SUM(rs.ratingCount) FROM ReviewSummary rs WHERE rs.product.id = :productId")
    Integer findTotalReviewCountByProductId(@Param("productId") UUID productId);
}
