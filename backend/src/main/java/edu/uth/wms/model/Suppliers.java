package edu.uth.wms.model;


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
import lombok.experimental.FieldDefaults;

// Table suppliers {
//   id bigint [pk, increment] // Java: Long
//   name nvarchar(100)
//   email varchar(100)
//   phone varchar(20)
// }
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "suppliers")
@Builder
public class Suppliers {

    @Id
    @Setter(AccessLevel.NONE) // Không cho tạo setter cho trường này
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "name", length = 100)
    String name;

    @Column(name = "email", length = 100, unique = true)
    String email;

    // Phone này của nhà sản xuất nên private Unique không?
    @Column(name = "phone", length = 20, unique = true)
    String phone;

}