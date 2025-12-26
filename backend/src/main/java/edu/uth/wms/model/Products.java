package edu.uth.wms.model;

import org.springframework.data.annotation.Id;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldDefaults;


// Table products {
//   id bigint [pk, increment] // Java: Long
//   category_id bigint // Java: Long
//   sku varchar(50) [unique, not null]
//   barcode varchar(50) [unique]
//   name nvarchar(255)
//   image_url varchar(500)
//   unit varchar(20)
//   price decimal(15,2)
// }
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "products")
public class Products {
    @Id
    @Setter(AccessLevel.NONE) //Không cho tạo setter cho trường này
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "category_id")
    Long category_id;
    
    @Column(name = "sku",length = 50, unique = true, nullable = false)
    String sku;
    
    @Column(name = "barcode", length = 50, unique = true)   
    String barcode;
    
    @Column(name = "name", length = 255)  
    String name;
    
    @Column(name = "image_url", length = 500)
    String image_url;
    
    @Column(name = "unit", length = 20)
    String unit;
    
    @Column(name = "price", precision = 15, scale = 2)
    Double price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Categories category;
}
