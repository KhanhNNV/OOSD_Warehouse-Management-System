package edu.uth.wms.service.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;

public class SecurityUtils {
    private SecurityUtils() {
    };

    // - Lấy Authentication hiện tại từ Security Context
    private static boolean hasRole(String roleName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return false;

        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(roleName));
    }

    // - Lấy tên người dùng hiện tại từ Security Context
    public static String getCurrentUserLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // System.out.println("=== DEBUG SECURITY UTILS ===");
        // System.out.println("Thread: " + Thread.currentThread().getName());
        // System.out.println("Authentication object: " + authentication);

        // if (authentication == null) {
        // System.out.println("WARNING: Authentication is NULL!");

        // // Debug xem có phải do SecurityContextHolder strategy không
        // SecurityContext context = SecurityContextHolder.getContext();
        // System.out.println("SecurityContext: " + context);

        // // In stack trace để biết ai gọi
        // new Exception("Debug stack trace").printStackTrace();
        // return null;
        // }

        // System.out.println("Is authenticated: " + authentication.isAuthenticated());
        // System.out.println("Principal class: " +
        // (authentication.getPrincipal() != null ?
        // authentication.getPrincipal().getClass().getName() : "null"));

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        // Không biết bay sao chứ t test nó trả usernamr = null (Principal không phải là
        // UserDetails hoặc String mà là đối tượng Jwt từ Spring Security OAuth2 )
        if (principal instanceof Jwt) {
            Jwt jwt = (Jwt) principal;
            // Lấy username từ claim "sub" (subject) trong JWT
            return jwt.getSubject();
        }
        if (principal instanceof UserDetails) { // Kiểm tra kiểu dữ liệu
            return ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            return (String) principal;
        }
        return null;
    }

    // - Những hàm check chức vụ
    public static boolean isManager() {
        return hasRole("ROLE_MANAGER");
    }

    public static boolean isStaff() {
        return hasRole("ROLE_STAFF");
    }

    public static boolean isAccountant() {
        return hasRole("ROLE_ACCOUNTANT");
    }

    public static boolean isAdmin() {
        return hasRole("ROLE_ADMIN");
    }

}