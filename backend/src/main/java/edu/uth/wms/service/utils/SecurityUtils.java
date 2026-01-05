package edu.uth.wms.service.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

public class SecurityUtils {
    private SecurityUtils(){};


    //- Lấy Authentication hiện tại từ Security Context
    private static boolean hasRole(String roleName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(roleName));
    }

    //- Lấy tên người dùng hiện tại từ Security Context
    public static String getCurrentUserLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) { // Kiểm tra kiểu dữ liệu 
            return ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            return (String) principal;
        }
        return null;
    }
    
    //- Những hàm check chức vụ
    public static boolean isManager(){
        return hasRole("ROLE_MANAGER");
    }

    public static boolean isStaff(){
        return hasRole("ROLE_STAFF");
    }

    public static boolean isAccountant(){
        return hasRole("ROLE_ACCOUNTANT");
    }

    public static boolean isAdmin(){
        return hasRole("ROLE_ADMIN");
    }


}
