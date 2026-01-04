package edu.uth.wms.service;

import edu.uth.wms.dto.request.UserCreateRequest;
import edu.uth.wms.dto.request.UserRoleRequest;
import edu.uth.wms.dto.response.UserCreateRespone;

import java.util.List;

public interface IUserService {
    UserCreateRespone createUser(UserCreateRequest user);

    UserCreateRespone updateRoleUser(UserRoleRequest userRoleRequest, Long userId);

    List<UserCreateRespone> getAlls();

    UserCreateRespone getUserById(Long id);

    List<UserCreateRespone> getUsersByRole(String role);
}
