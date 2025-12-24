package edu.uth.wms.model;

import org.springframework.data.annotation.AccessType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


// Table locations {
//   id bigint [pk, increment] // Java: Long
//   code varchar(50) [unique, note: "Mã kệ (VD: A-01-01)"]
//   type location_type
//   is_full boolean [default: false]
// }
@Entity
@Getter
@Setter
@AccessType(AccessType.Type.FIELD)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "locations")
public class Locations {
    @Id
    @Setter(AccessLevel.NONE) //Không cho tạo setter cho trường này
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "code", length = 50, unique = true, nullable = false)
    String code;

    @Column(name = "type", length = 50)
    String locationtType;

    @Column(name = "is_full")
    @Builder.Default
    Boolean isFull= false;


}