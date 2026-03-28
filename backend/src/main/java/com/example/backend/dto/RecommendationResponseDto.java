package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecommendationResponseDto {
    private String userId;
    private int topN;
    private List<RecommendedProductDto> results;
    private Map<String, Double> modelWeights;
    private boolean isColdStart;
    private String message;
}
