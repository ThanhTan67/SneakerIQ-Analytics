package com.example.backend.repository;

import com.example.backend.entity.DataSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DataSourceRepository extends JpaRepository<DataSource, UUID> {
    List<DataSource> findByBrandIdAndActiveTrue(UUID brandId);
    List<DataSource> findByActiveTrue();
    Optional<DataSource> findBySourceNameIgnoreCase(String sourceName);
}
