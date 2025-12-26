package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.uth.wms.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "phone_number", nullable = false, unique = true)
    private String phoneNumber;

    @Column(name = "full_name",length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "is_active")
    private Boolean isActive;

    @OneToMany(mappedBy = "processedByUser", fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore // Không trả về list này khi query thông tin User
    private List<InboundNote> processedInboundNotes;

}
