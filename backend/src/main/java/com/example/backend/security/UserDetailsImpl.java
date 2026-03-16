package com.example.backend.security;

import com.example.backend.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

public record UserDetailsImpl(User user) implements UserDetails {

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = user.getRole() != null ? user.getRole().getName() : null;
        return roleName != null
                ? Collections.singleton(new SimpleGrantedAuthority("ROLE_" + roleName))
                : Collections.emptyList();
    }

    public int getTokenVersion() {
        return user.getTokenVersion();
    }

    public UUID getId() {
        return user.getId();
    }

    @Override public String getPassword() { return user.getHashedPassword(); }
    @Override public String getUsername() { return user.getEmail(); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return !user.isLocked(); }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return user.isEnabled(); }
}