package com.example.backend.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "InforDefault")
public class InforDefault extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private boolean isDefault;
}
