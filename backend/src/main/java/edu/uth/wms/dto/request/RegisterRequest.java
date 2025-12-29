package edu.uth.wms.dto.request;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class RegisterRequest {
    String username;
    String password;
    String fullName;
    String phoneNumber;
}
