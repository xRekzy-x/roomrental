package com.hung.roomrental.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vehicle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class vehicle {

    @Id
    @Column(name = "id", nullable = false, unique = true, length = 40)
    private String id;

    @Column(name = "plate_number", nullable = false, unique = true, length = 20)
    private String plateNumber;

    @Column(name = "vehicle_type", length = 20)
    private String vehicleType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_number")
    @JsonIgnoreProperties({"renters", "hibernateLazyInitializer", "handler"})
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
}