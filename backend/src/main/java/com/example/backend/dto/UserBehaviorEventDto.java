package com.example.backend.dto;

import com.example.backend.enums.BehaviorEventType;
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
public class UserBehaviorEventDto {
    private BehaviorEventType eventType;
    private String productId;
    private String variantId;
    private String sessionId;
}
