package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.UserCreateRequest;
import edu.uth.wms.dto.request.UserRoleRequest;
import edu.uth.wms.dto.response.UserCreateRespone;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.Role;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

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
            throw new BadRequestException("Role không hợp lệ: " + request.getRole());
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DataIntegrityViolationException("username " + request.getUsername() + " đã tồn tại");
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new DataIntegrityViolationException("Số điện thoại này đã tồn tại");
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

    @Override
    // Đã đổi kiểu trả về từ UserRoleResponse sang UserCreateRespone
    public UserCreateRespone updateRoleUser(UserRoleRequest userRoleRequest, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại!"));

        Role role;
        try {
            role = Role.valueOf(userRoleRequest.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Role không hợp lệ: " + userRoleRequest.getRole());
        }

        user.setRole(role);
        userRepository.save(user);

        return toDto(user);
    }

    @Override
    public List<UserCreateRespone> getAlls() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public UserCreateRespone getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        return toDto(user);
    }

    @Override
    public List<UserCreateRespone> getUsersByRole(String role) {
        Role roleEnum;
        try {
            roleEnum = Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Role không hợp lệ!");
        }

        return userRepository.findByRole(roleEnum)
                .stream()
                .map(this::toDto)
                .toList();
    }

    // Hàm chuyển đổi entity sang DTO dùng chung
    private UserCreateRespone toDto(User user) {
        return UserCreateRespone.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .build();
    }
}