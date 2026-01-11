package edu.uth.wms.service.utils;

import edu.uth.wms.model.User;
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
        return authentication.getName();
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