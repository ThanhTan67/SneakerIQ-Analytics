package com.example.backend.repository;

import com.example.backend.entity.Product;
import com.example.backend.enums.GenderOptions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySku(String sku);

    Page<Product> findByBrandId(UUID brandId, Pageable pageable);

    Page<Product> findByBrandSlug(String brandSlug, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "(:brandId IS NULL OR p.brand.id = :brandId) AND " +
           "(:gender IS NULL OR p.gender = :gender) AND " +
           "(:minPrice IS NULL OR p.currentPrice >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.currentPrice <= :maxPrice) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchProducts(
            @Param("brandId") UUID brandId,
            @Param("gender") GenderOptions gender,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT p FROM Product p WHERE p.trending = true ORDER BY p.viewCount DESC")
    List<Product> findTrendingProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.newArrival = true ORDER BY p.createdAt DESC")
    List<Product> findNewArrivals(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.discountPercent IS NOT NULL AND p.discountPercent > 0 " +
           "ORDER BY p.discountPercent DESC")
    List<Product> findTopDiscounted(Pageable pageable);

    @Query("SELECT p FROM Product p JOIN p.insight i WHERE i.dealScore >= :minScore ORDER BY i.dealScore DESC")
    List<Product> findBestDeals(@Param("minScore") int minScore, Pageable pageable);

    @Query("SELECT p FROM Product p JOIN p.insight i WHERE " +
           "p.brand.slug = :brandSlug ORDER BY i.dealScore DESC")
    List<Product> findBestDealsByBrand(@Param("brandSlug") String brandSlug, Pageable pageable);

    List<Product> findByBrandSlugAndIdNot(String brandSlug, UUID productId, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.brand.id = :brandId")
    long countByBrandId(@Param("brandId") UUID brandId);
}
