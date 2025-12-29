package edu.uth.wms.service.auth;

import edu.uth.wms.dto.request.LoginRequest;
import edu.uth.wms.dto.request.RegisterRequest;
import edu.uth.wms.dto.response.LoginResponse;
import edu.uth.wms.dto.response.RegisterResponse;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.Role;
import edu.uth.wms.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest loginRequest) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword());
        Authentication authentication = authenticationManager.authenticate(token);

        User user = (User) authentication.getPrincipal();

        String accesToken=jwtService.generateAccessToken(user);
        String refreshToke=jwtService.generateRefreshToken(user);
        // trả về token
        return LoginResponse.builder()
                .accessToken(accesToken)
                .refreshToken(refreshToke)
                .build();
    }

    public RegisterResponse register(RegisterRequest request) {
        // 1. Kiểm tra xem username đã tồn tại chưa
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // 2. Tạo User entity từ request
        User newUser = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword())) // Mã hóa mật khẩu
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(Role.NONE) // Set quyền mặc định, ví dụ là USER
                .build();

        // 3. Lưu vào DB
        User savedUser = userRepository.save(newUser);


        return RegisterResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .fullName(savedUser.getFullName())
                .phoneNumber(savedUser.getPhoneNumber())
                .role(savedUser.getRole().toString())
                .build();
    }
}
