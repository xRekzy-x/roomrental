package com.hung.roomrental.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "room")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false, unique = true)
    private String roomNumber;

    @Column(name = "area")
    private Double area;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Column(name = "current_renters")
    private Integer currentRenters;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private roomStatus status;

    @OneToMany(mappedBy = "room")
    @JsonIgnore //Ngắt hoàn toàn vòng lặp từ room sang renter - tránh lặp lại vô hạn
    private List<renter> renters = new ArrayList<>();
}