package edu.uth.wms.service.auth;

import edu.uth.wms.dto.request.LoginRequest;
import edu.uth.wms.dto.request.RefreshTokenRequest;
import edu.uth.wms.dto.request.RegisterRequest;
import edu.uth.wms.dto.response.LoginResponse;
import edu.uth.wms.dto.response.RefreshTokenResponse;
import edu.uth.wms.dto.response.RegisterResponse;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.Role;
import edu.uth.wms.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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

    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        try {
            // 1. Verify token (Check chữ ký và hạn sử dụng)
            if (!jwtService.verifyToken(request.getRefreshToken())) {
                throw new RuntimeException("Refresh token invalid or expired");
            }

            // 2. Lấy username từ token
            String username = jwtService.extractUsername(request.getRefreshToken());

            // 3. Lấy User mới nhất từ DB để đảm bảo quyền (Role) cập nhật mới nhất
            // Lưu ý: User của bạn phải là Entity implement UserDetails hoặc bạn map sang
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            // 4. Generate Access Token mới
            String newAccessToken = jwtService.generateAccessToken(user);

            // (Tùy chọn) Generate Refresh Token mới nếu muốn xoay vòng (Token Rotation)
            // String newRefreshToken = jwtService.generateRefreshToken(user);

            return RefreshTokenResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(request.getRefreshToken()) // Giữ nguyên hoặc trả về mới
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Could not refresh token", e);
        }
    }
}
