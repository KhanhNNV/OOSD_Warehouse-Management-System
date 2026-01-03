package edu.uth.wms.controller;

import edu.uth.wms.dto.request.UserCreateRequest;
import edu.uth.wms.dto.response.UserCreateRespone;
import edu.uth.wms.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final IUserService userService;

    @PostMapping
    public UserCreateRespone createUser(@RequestBody UserCreateRequest userCreateRequest) {
        return userService.createUser(userCreateRequest);
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
