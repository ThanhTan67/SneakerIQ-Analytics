package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "data_sources")
public class DataSource extends BaseEntity {
    @Column(nullable = false)
    private String sourceName;

    private String sourceType; // OFFICIAL, MARKETPLACE, OUTLET, RESELLER

    private String baseUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    private boolean active = true;

    private int trustScore = 100; // 0-100 reliability score
}
