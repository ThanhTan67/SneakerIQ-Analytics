package com.example.backend.repository;

import com.example.backend.entity.ExternalReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExternalReferenceRepository extends JpaRepository<ExternalReference, UUID> {

    Optional<ExternalReference> findBySourceNameAndExternalId(String sourceName, String externalId);

    List<ExternalReference> findByProductId(UUID productId);

    Optional<ExternalReference> findByProductIdAndSourceName(UUID productId, String sourceName);

    boolean existsBySourceNameAndExternalId(String sourceName, String externalId);
}
