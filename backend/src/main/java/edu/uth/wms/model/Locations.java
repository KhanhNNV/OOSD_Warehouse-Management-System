package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.uth.wms.model.enums.LocationType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.AccessType;

import java.util.List;


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

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    LocationType locationtType;

    @Column(name = "is_full")
    @Builder.Default
    Boolean isFull= false;

    @OneToMany(mappedBy = "location")
    @ToString.Exclude
    private List<Inventory> inventories;



}