package edu.uth.wms.controller.jwt;

import edu.uth.wms.dto.request.LoginRequest;
import edu.uth.wms.dto.request.RegisterRequest;
import edu.uth.wms.dto.request.UserCreateRequest;
import edu.uth.wms.dto.response.LoginResponse;
import edu.uth.wms.dto.response.RefreshTokenResponse;
import edu.uth.wms.dto.response.RegisterResponse;
import edu.uth.wms.dto.response.UserCreateRespone;
import edu.uth.wms.service.auth.AuthenticationService;
import edu.uth.wms.service.auth.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie; // Import this
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationService authenticationService;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse loginResponse = authenticationService.login(request);

        // Improved: Use ResponseCookie builder
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", loginResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false) // CHANGE TO TRUE IN PRODUCTION (HTTPS)
                .path("/")
                .maxAge(30 * 24 * 60 * 60) // 30 days
                .sameSite("Strict") // Prevents CSRF
                .build();

        // Remove Refresh Token from body
        loginResponse.setRefreshToken(null);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString()) // Add to header
                .body(loginResponse);
    }

    @PostMapping("/register")
    public RegisterResponse register(@RequestBody RegisterRequest registerRequest) {
        return authenticationService.register(registerRequest);
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(403).build();
        }

        try {
            RefreshTokenResponse response = jwtService.refreshToken(refreshToken);

            // Important: If the Refresh Token is rotated (changed), update the cookie!
            // If your logic returns a NEW refresh token, update it here:
            if (response.getRefreshToken() != null) {
                ResponseCookie newRefreshTokenCookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                        .httpOnly(true)
                        .secure(false) // CHANGE TO TRUE IN PRODUCTION
                        .path("/")
                        .maxAge(30 * 24 * 60 * 60)
                        .sameSite("Strict")
                        .build();

                // Clean up body so we don't return refresh token in JSON
                response.setRefreshToken(null);

                return ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, newRefreshTokenCookie.toString())
                        .body(response);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/logout") // Fixed path: was /auth/logout (resulting in /auth/auth/logout)
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0) // Expire immediately
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

}