package com.example.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@Getter
@Setter
@Validated
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    @NotBlank(message = "JWT secret must not be blank")
    private String secret;

    @Positive(message = "Access token expiration must be positive")
    private long accessTokenExpirationMs = 3600000; // 1 hour

    @Positive(message = "Refresh token expiration must be positive")
    private long refreshTokenExpirationMs = 604800000; // 7 days
}

