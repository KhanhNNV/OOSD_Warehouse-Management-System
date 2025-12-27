package edu.uth.wms.controller;


import edu.uth.wms.dto.request.UserCreateRequest;
import edu.uth.wms.dto.response.UserCreateRespone;
import edu.uth.wms.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserController {
    private final IUserService userService;

    @PostMapping("/auth/register")
    public UserCreateRespone createUser(@RequestBody UserCreateRequest userCreateRequest){
        return userService.createUser(userCreateRequest);
    }
}
