package edu.uth.wms.model;


import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

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
    BigDecimal price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Categories category;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<Inventory> inventories;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<InventoryTransaction> transactions;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<PODetail> poDetails;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<OutboundDetail> outboundDetails;
}
