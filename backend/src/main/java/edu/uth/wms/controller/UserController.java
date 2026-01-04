package edu.uth.wms.controller;

import edu.uth.wms.dto.request.UserCreateRequest;
import edu.uth.wms.dto.request.UserRoleRequest;
import edu.uth.wms.dto.response.UserCreateRespone;
import edu.uth.wms.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final IUserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<UserCreateRespone> getAllUsers(){
        return userService.getAlls();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public UserCreateRespone getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<UserCreateRespone> getUsersByRole(@PathVariable String role) {
        return userService.getUsersByRole(role);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserCreateRespone createUser(@RequestBody UserCreateRequest userCreateRequest) {
        return userService.createUser(userCreateRequest);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public UserCreateRespone updateRoleUser(
            @RequestBody UserRoleRequest userRoleRequest,
            @PathVariable Long id){
        return userService.updateRoleUser(userRoleRequest,id);
    }

    @GetMapping("/auth/login")
    public String login() {
        return "login";
    }

    @GetMapping("/logint2")
    public String login2() {
        return "login2";
    }
}
