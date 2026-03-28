package com.example.backend.repository;

import com.example.backend.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DealRepository extends JpaRepository<Deal, UUID> {

    List<Deal> findByProductIdAndActiveTrue(UUID productId);

    @Query("SELECT d FROM Deal d WHERE d.active = true ORDER BY d.createdAt DESC")
    List<Deal> findActiveDeals();

    @Query("SELECT d FROM Deal d WHERE d.product.brand.slug = :brandSlug AND d.active = true")
    List<Deal> findActiveDealsByBrand(@Param("brandSlug") String brandSlug);
}
