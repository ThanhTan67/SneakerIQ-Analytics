package com.example.backend.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "suppliers")
public class Supplier extends BaseEntity {
    private String name;
    private String email;
    private String phone;
    private String address;
}
