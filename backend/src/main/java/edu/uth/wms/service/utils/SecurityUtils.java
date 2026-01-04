package edu.uth.wms.service.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {
    private SecurityUtils(){};


    //- Lấy Authentication hiện tại từ Security Context
    private static boolean hasRole(String roleName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(roleName));
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
