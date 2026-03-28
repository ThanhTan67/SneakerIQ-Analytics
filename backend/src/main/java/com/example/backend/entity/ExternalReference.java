package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "external_references", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "sourceName"})
}, indexes = {
    @Index(name = "idx_extref_source", columnList = "sourceName"),
    @Index(name = "idx_extref_external_id", columnList = "externalId")
})
public class ExternalReference extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 100)
    private String sourceName; // 'nike', 'amazon', 'sneakerdb', etc.

    @Column(nullable = false, length = 255)
    private String externalId; // Product ID on the external source

    @Column(columnDefinition = "TEXT")
    private String externalUrl; // Direct link to the product on the source

    @Column(length = 100)
    private String externalSku; // SKU on the external source

    private Instant lastSyncedAt;
}
