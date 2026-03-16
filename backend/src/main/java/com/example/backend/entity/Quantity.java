package com.example.backend.entity;

import java.math.BigDecimal;

import com.example.backend.enums.UnitOfMeasure;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "quantities")
public class Quantity extends BaseEntity{
    private UnitOfMeasure unitOfMeasure;
    private BigDecimal value;
}
