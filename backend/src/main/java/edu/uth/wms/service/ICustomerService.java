package edu.uth.wms.service;

import java.util.List;

import edu.uth.wms.dto.request.CustomerRequest;
import edu.uth.wms.dto.response.CustomerResponse;

public interface ICustomerService {
    List<CustomerResponse> getAllCustomers();

    CustomerResponse createCustomer(CustomerRequest request, String userName);

    CustomerResponse updateCustomer(Long customerId, CustomerRequest request);

    void deleteCustomer(Long customerId);

    void permanentDeleteCustomer(Long customerId);

    CustomerResponse activateCustomer(Long customerId);

    CustomerResponse getCustomerById(Long customerId);
}
