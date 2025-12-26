package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

// Table categories {
//   id bigint [pk, increment] // Java: Long
//   name nvarchar(100)
// }
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "categories")
@Builder

public class Categories {
    @Id
    @Setter(AccessLevel.NONE) //Không cho tạo setter cho trường này
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "name", length = 100)
    String name;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @ToString.Exclude // Tránh đệ quy vô tận khi in log
    private List<Products> products;
}