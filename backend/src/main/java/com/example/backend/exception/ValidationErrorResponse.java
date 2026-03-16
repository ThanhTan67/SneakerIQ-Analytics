package com.example.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ValidationErrorResponse {

    private int status;
    private String error;
    private String message;
    private Instant timestamp;
    private String path;
    private List<ValidationError> errors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationError {
        private String field;
        private String rejectedValue;
        private String message;
        private String code;
    }

    // Helper method to create from field errors map
    public static ValidationErrorResponse fromFieldErrors(
            int status,
            String error,
            String message,
            Instant timestamp,
            String path,
            Map<String, String> fieldErrors) {

        List<ValidationError> errors = fieldErrors.entrySet().stream()
                .map(entry -> ValidationError.builder()
                        .field(entry.getKey())
                        .message(entry.getValue())
                        .build())
                .toList();

        return ValidationErrorResponse.builder()
                .status(status)
                .error(error)
                .message(message)
                .timestamp(timestamp)
                .path(path)
                .errors(errors)
                .build();
    }
}