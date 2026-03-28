package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecommendedProductDto {
    private String productId;
    private String variantId;
    private String name;
    private String categoryName;
    private String brandName;
    private Double price;
    private String imageUrl;
    private Double finalScore;
    private ModelScoresDto scores;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ModelScoresDto {
        private Double svd;
        private Double ncf;
        private Double content;
        private Double rule;
        private Double behavior;
    }
}
