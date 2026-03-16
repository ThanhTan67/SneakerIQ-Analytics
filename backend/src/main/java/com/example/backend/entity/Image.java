package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Table(name = "iamges")
public class Image extends BaseEntity {
    private String url;
    private String publicId;
    private String position;

}
