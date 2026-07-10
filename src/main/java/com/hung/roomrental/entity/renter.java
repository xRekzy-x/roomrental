package com.hung.roomrental.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "renter")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class renter {

    @Id
    @Column(name = "id", nullable = false, unique = true, length = 30)
    private String id;

    @NotBlank(message = "Tên khách thuê không được để trống")
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @NotBlank(message = "CCCD không được để trống")
    @Column(name = "cccd_number", nullable = false, unique = true, length = 20)
    private String cccdNumber;

    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "dob")
    private LocalDate dob;

    // ĐÃ SỬA: Chuyển từ LAZY sang EAGER để tránh lỗi LazyInitializationException
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_number")
    private room room;

    @Transient
    @JsonIgnore
    private String roomNumber;

    @JsonProperty("roomNumber")
    public String getRoomNumber() {
        return room != null ? room.getRoomNumber() : roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    @OneToMany(mappedBy = "renter")
    @JsonIgnore
    private List<account> accounts = new ArrayList<>();
}