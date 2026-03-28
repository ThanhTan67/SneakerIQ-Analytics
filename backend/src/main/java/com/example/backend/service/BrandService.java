package com.example.backend.service;

import com.example.backend.dto.BrandDto;
import com.example.backend.entity.Brand;
import com.example.backend.repository.BrandRepository;
import com.example.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;

    public List<BrandDto> getAllBrands() {
        return brandRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public BrandDto getBrandBySlug(String slug) {
        Brand brand = brandRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Brand not found: " + slug));
        return toDto(brand);
    }

    private BrandDto toDto(Brand b) {
        BrandDto dto = new BrandDto();
        dto.setId(b.getId());
        dto.setName(b.getName());
        dto.setSlug(b.getSlug());
        dto.setLogo(b.getLogo());
        dto.setDescription(b.getDescription());
        dto.setProductCount(productRepository.countByBrandId(b.getId()));
        return dto;
    }
}
