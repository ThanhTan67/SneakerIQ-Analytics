package com.example.backend.security;

import com.example.backend.config.JwtConfig;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;
    private final SecretKey secretKey;

    public JwtTokenProvider(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
        if (jwtConfig == null || jwtConfig.getSecret() == null || jwtConfig.getSecret().isBlank()) {
            throw new IllegalStateException("JWT secret must be configured");
        }
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtConfig.getSecret()));
    }

    public String generateAccessToken(String username, UUID userId, int tokenVersion) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtConfig.getAccessTokenExpirationMs());

        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId.toString())
                .claim("tokenVersion", tokenVersion)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String generateRefreshToken(String username, UUID userId, int tokenVersion) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtConfig.getRefreshTokenExpirationMs());

        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId.toString())
                .claim("tokenVersion", tokenVersion)
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = getClaims(token);
        return claims != null ? claims.getSubject() : null;
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        if (claims == null) return null;
        String id = claims.get("userId", String.class);
        return id != null ? UUID.fromString(id) : null;
    }

    public int getTokenVersionFromToken(String token) {
        Claims claims = getClaims(token);
        if (claims == null) return 0;
        Integer version = claims.get("tokenVersion", Integer.class);
        return version != null ? version : 0;
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            return null;
        }
    }
}