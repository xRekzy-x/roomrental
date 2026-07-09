package com.hung.roomrental.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "renter")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class renter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "cccd_number", nullable = false, unique = true, length = 20)
    private String cccdNumber;

    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "dob")
    private LocalDate dob;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private room room;

    @OneToMany(mappedBy = "renter")
    @JsonIgnore // Ngắt vòng lặp danh sách phương tiện
    private List<vehicle> vehicles = new ArrayList<>();

    @OneToMany(mappedBy = "renter")
    @JsonIgnore // Ngắt vòng lặp danh sách tài khoản
    private List<account> accounts = new ArrayList<>();
}
