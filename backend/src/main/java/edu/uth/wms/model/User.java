package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.uth.wms.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(name = "phone_number", nullable = false, unique = true)
    private String phoneNumber;

    @Column(name = "full_name",length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive=true;

    // --- RELATIONSHIPS (Bidirectional) ---

    // 1 User tạo nhiều PO
    @OneToMany(mappedBy = "createdBy")
    @ToString.Exclude
    @JsonIgnore
    private List<PurchaseOrder> createdPurchaseOrders;

    // 1 User xử lý nhiều Inbound Note (Thủ kho)
    @OneToMany(mappedBy = "processedBy")
    @ToString.Exclude
    @JsonIgnore
    private List<InboundNote> processedInboundNotes;

    // 1 User tạo nhiều Outbound Order (Sale)
    @OneToMany(mappedBy = "createdBy")
    @ToString.Exclude
    @JsonIgnore
    private List<OutboundOrder> createdOutboundOrders;

    // 1 User đi nhặt hàng cho nhiều Order (Picker)
    @OneToMany(mappedBy = "assignedPicker")
    @ToString.Exclude
    @JsonIgnore
    private List<OutboundOrder> assignedPickTasks;

    // 1 User tạo nhiều phiên kiểm kê
    @OneToMany(mappedBy = "createdBy")
    @ToString.Exclude
    private List<StocktakeSession> createdStocktakeSessions;

    // 1 User thực hiện nhiều Transaction (Log)
    @OneToMany(mappedBy = "performedBy")
    @ToString.Exclude
    private List<InventoryTransaction> transactions;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Kiểm tra xem role có null không để tránh lỗi
        if (role == null) {
            return Collections.emptyList();
        }

        // Chuyển Enum Role thành SimpleGrantedAuthority
        // role.name() sẽ trả về "ADMIN" hoặc "USER"...
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }


    //UserDetail
}
