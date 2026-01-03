package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.UserCreateRequest;
import edu.uth.wms.dto.response.UserCreateRespone;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.Role;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {
    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Override
    public UserCreateRespone createUser(UserCreateRequest request) {

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Role không hợp lệ: " + request.getRole());
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("User with username " + request.getUsername() + " already exists");
        }


        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(role)
                .build();
        userRepository.save(user);
        return toDto(user);
    }

    private UserCreateRespone toDto(User user) {
        return UserCreateRespone.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber() != null ? user.getPhoneNumber() : null)
                .role(user.getRole().name())
                .build();
    }
}
