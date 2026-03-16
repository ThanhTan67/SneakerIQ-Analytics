package com.example.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private int status;
    private String error;
    private String message;
    private String errorCode;
    private Instant timestamp;
    private String path;
    private Map<String, String> validationErrors;

    // Constructor for simple errors
    public ErrorResponse(int status, String error, String message, Instant timestamp) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = timestamp;
    }

    // Constructor with error code
    public ErrorResponse(int status, String error, String message, String errorCode, Instant timestamp) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.errorCode = errorCode;
        this.timestamp = timestamp;
    }

    // Constructor with path
    public ErrorResponse(int status, String error, String message, Instant timestamp, String path) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = timestamp;
        this.path = path;
    }
}