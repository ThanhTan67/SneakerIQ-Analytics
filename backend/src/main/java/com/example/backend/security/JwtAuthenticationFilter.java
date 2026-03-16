package com.example.backend.security;

import jakarta.annotation.Nonnull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @Nonnull HttpServletRequest request,
            @Nonnull HttpServletResponse response,
            @Nonnull FilterChain filterChain)
            throws ServletException, IOException {

        String jwt = extractJwtFromRequest(request);

        if (jwt != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                if (jwtTokenProvider.validateToken(jwt)) {
                    String username = jwtTokenProvider.getUsernameFromToken(jwt);
                    if (username != null && !username.isBlank()) {

                        UUID tokenUserId = jwtTokenProvider.getUserIdFromToken(jwt);
                        int tokenVersion = jwtTokenProvider.getTokenVersionFromToken(jwt);

                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        UserDetailsImpl user = (UserDetailsImpl) userDetails;

                        boolean accountValid = userDetails.isEnabled()
                                && userDetails.isAccountNonExpired()
                                && userDetails.isAccountNonLocked()
                                && userDetails.isCredentialsNonExpired();

                        boolean tokenValid = tokenVersion == user.getTokenVersion()
                                && (tokenUserId == null || tokenUserId.equals(user.getId()));

                        if (accountValid && tokenValid) {
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());
                            authentication.setDetails(
                                    new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                }
            } catch (Exception ex) {
                logger.debug("Cannot set JWT authentication", ex);
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}