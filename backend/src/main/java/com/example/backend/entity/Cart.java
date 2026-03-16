package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "carts")
public class Cart extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;
}
