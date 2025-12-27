package edu.uth.wms.service;

import edu.uth.wms.dto.request.UserCreateRequest;
import edu.uth.wms.dto.response.UserCreateRespone;
import edu.uth.wms.model.User;

public interface IUserService {
    UserCreateRespone createUser(UserCreateRequest user);
}
