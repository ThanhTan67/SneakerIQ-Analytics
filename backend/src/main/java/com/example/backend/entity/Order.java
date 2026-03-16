package com.example.backend.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "orders")
public class Order extends BaseEntity{
    private String nameReceiver;
    private String phone;
    private String orderUser;
    private String bookingDate;
    private String deliveryDate;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private String orderAddress;
    private String notes;
    private String status;
    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;
}
