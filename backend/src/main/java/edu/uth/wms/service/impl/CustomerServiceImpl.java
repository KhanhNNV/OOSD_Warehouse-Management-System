package edu.uth.wms.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.uth.wms.dto.request.CustomerRequest;
import edu.uth.wms.dto.response.CustomerResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.Customer;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.CustomerType;
import edu.uth.wms.repository.ICustomerRepository;
import edu.uth.wms.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CustomerServiceImpl {

    private final ICustomerRepository customerRepository;
    private final IUserRepository userRepository;

    public List<CustomerResponse> getAllCustomers() {
        List<Customer> customers = customerRepository.findAll();
        return customers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Tạo khách hàng mới
     */
    public CustomerResponse createCustomer(CustomerRequest request, String userName) {
        log.info("Tạo khách hàng mới: {}", request.getName());

        // Validate trùng lặp
        validateDuplicate(request.getPhone(), request.getEmail(), request.getTaxCode(), null);

        // Lấy user tạo
        User createdBy = userRepository.findByUsername(userName)
                .orElseThrow(() -> new ResourceNotFoundException("User" + userName + " không tồn tại."));

        // Tạo customer
        Customer customer = Customer.builder().name(request.getName()).companyName(request.getCompanyName())
                .phone(request.getPhone()).email(request.getEmail()).address(request.getAddress())
                .taxCode(request.getTaxCode()).customerType(request.getCustomerType()).isActive(request.getIsActive())
                .notes(request.getNotes()).createdBy(createdBy).build();

        Customer savedCustomer = customerRepository.save(customer);

        log.info("Đã tạo khách hàng ID: {}", savedCustomer.getId());

        return mapToResponse(savedCustomer);
    }

    /**
     * Cập nhật thông tin khách hàng
     */
    public CustomerResponse updateCustomer(Long customerId, CustomerRequest request) {
        log.info("Cập nhật khách hàng ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng không tồn tại với ID: " + customerId));

        // Validate trùng lặp (trừ chính customer này)
        validateDuplicate(request.getPhone(), request.getEmail(), request.getTaxCode(), customerId);

        // Update các field nếu có
        if (request.getName() != null) {
            customer.setName(request.getName());
        }
        if (request.getCompanyName() != null) {
            customer.setCompanyName(request.getCompanyName());
        }
        if (request.getPhone() != null) {
            customer.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            customer.setEmail(request.getEmail());
        }
        if (request.getAddress() != null) {
            customer.setAddress(request.getAddress());
        }
        if (request.getTaxCode() != null) {
            customer.setTaxCode(request.getTaxCode());
        }
        if (request.getCustomerType() != null) {
            customer.setCustomerType(request.getCustomerType());
        }

        if (request.getIsActive() != null) {
            customer.setIsActive(request.getIsActive());
        }
        if (request.getNotes() != null) {
            customer.setNotes(request.getNotes());
        }

        Customer updatedCustomer = customerRepository.save(customer);

        log.info("Đã cập nhật khách hàng ID: {}", customerId);

        return mapToResponse(updatedCustomer);
    }

    /**
     * Xóa khách hàng (Soft delete - chuyển isActive = false)
     */
    public void deleteCustomer(Long customerId) {
        log.info("Xóa khách hàng ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng không tồn tại với ID: " + customerId));

        // Soft delete
        customer.setIsActive(false);
        customerRepository.save(customer);

        log.info("Đã vô hiệu hóa khách hàng ID: {}", customerId);
    }

    /**
     * Xóa vĩnh viễn (Hard delete)
     */
    public void permanentDeleteCustomer(Long customerId) {
        log.info("Xóa vĩnh viễn khách hàng ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng không tồn tại với ID: " + customerId));

        // Kiểm tra xem customer có đơn hàng chưa
        // TODO: Check foreign key constraints

        customerRepository.delete(customer);

        log.info("Đã xóa vĩnh viễn khách hàng ID: {}", customerId);
    }

    /**
     * Kích hoạt lại khách hàng
     */
    public CustomerResponse activateCustomer(Long customerId) {
        log.info("Kích hoạt lại khách hàng ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng không tồn tại với ID: " + customerId));

        customer.setIsActive(true);
        Customer activatedCustomer = customerRepository.save(customer);

        log.info("Đã kích hoạt khách hàng ID: {}", customerId);

        return mapToResponse(activatedCustomer);
    }

    /**
     * Lấy chi tiết khách hàng
     */
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long customerId) {
        log.info("Lấy chi tiết khách hàng ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng không tồn tại với ID: " + customerId));

        return mapToResponse(customer);
    }

    /**
     * Lấy danh sách khách hàng (có filter và phân trang)
     */
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getCustomers(Boolean isActive, CustomerType customerType, String keyword, int page,
            int size, String sortBy) {
        log.info("Lấy danh sách khách hàng - page: {}, size: {}", page, size);

        Sort sort = Sort.by(Sort.Direction.DESC, sortBy != null ? sortBy : "createdDate");
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Customer> customers = customerRepository.filterCustomers(isActive, customerType, keyword, pageable);

        return customers.map(this::mapToResponse);
    }

    /**
     * Tìm kiếm khách hàng theo keyword
     */
    @Transactional(readOnly = true)
    public Page<CustomerResponse> searchCustomers(String keyword, int page, int size) {
        log.info("Tìm kiếm khách hàng: {}", keyword);

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Customer> customers = customerRepository.searchCustomers(keyword, pageable);

        return customers.map(this::mapToResponse);
    }

    /**
     * Lấy danh sách khách hàng theo loại
     */
    @Transactional(readOnly = true)
    public List<CustomerResponse> getCustomersByType(CustomerType customerType) {
        log.info("Lấy danh sách khách hàng loại: {}", customerType);

        List<Customer> customers = customerRepository.findByCustomerType(customerType);

        return customers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Lấy thống kê tổng quan
     */
    // @Transactional(readOnly = true)
    // public CustomerSummaryResponse getCustomerSummary() {
    // log.info("Lấy thống kê khách hàng");

    // Long totalCustomers = customerRepository.count();
    // Long activeCustomers = customerRepository.countActiveCustomers();
    // Long inactiveCustomers = customerRepository.countInactiveCustomers();
    // Double totalDebt = customerRepository.sumTotalDebt();
    // Double totalCreditLimit = customerRepository.sumTotalCreditLimit();

    // return
    // CustomerSummaryResponse.builder().totalCustomers(totalCustomers).activeCustomers(activeCustomers)
    // .inactiveCustomers(inactiveCustomers).totalDebt(totalDebt != null ? totalDebt
    // : 0.0)
    // .totalCreditLimit(totalCreditLimit != null ? totalCreditLimit : 0.0).build();
    // }

    /**
     * Lấy danh sách khách hàng vượt hạn mức tín dụng
     */
    // @Transactional(readOnly = true)
    // public List<CustomerResponse> getCustomersExceedingCreditLimit() {
    // log.info("Lấy danh sách khách hàng vượt hạn mức");

    // List<Customer> customers =
    // customerRepository.findCustomersExceedingCreditLimit();

    // return
    // customers.stream().map(this::mapToResponse).collect(Collectors.toList());
    // }

    /**
     * Lấy danh sách khách hàng sắp đạt hạn mức (>80%)
     */
    // @Transactional(readOnly = true)
    // public List<CustomerResponse> getCustomersNearCreditLimit() {
    // log.info("Lấy danh sách khách hàng gần đạt hạn mức");

    // List<Customer> customers = customerRepository.findCustomersNearCreditLimit();

    // return
    // customers.stream().map(this::mapToResponse).collect(Collectors.toList());
    // }

    /**
     * Cập nhật công nợ khách hàng
     */
    // public CustomerResponse updateDebt(Long customerId, Double amount, boolean
    // isIncrease) {
    // log.info("Cập nhật công nợ khách hàng ID: {}, số tiền: {}", customerId,
    // amount);

    // Customer customer = customerRepository.findById(customerId)
    // .orElseThrow(() -> new NotFoundException("Khách hàng không tồn tại với ID: "
    // + customerId));

    // Double currentDebt = customer.getCurrentDebt();
    // Double newDebt = isIncrease ? currentDebt + amount : currentDebt - amount;

    // if (newDebt < 0) {
    // throw new BusinessException("Công nợ không thể âm");
    // }

    // customer.setCurrentDebt(newDebt);
    // Customer updatedCustomer = customerRepository.save(customer);

    // log.info("Đã cập nhật công nợ khách hàng ID: {} - Công nợ mới: {}",
    // customerId, newDebt);

    // return mapToResponse(updatedCustomer);
    // }

    /**
     * Validate trùng lặp
     */
    private void validateDuplicate(String phone, String email, String taxCode, Long excludeCustomerId) {
        if (phone != null && !phone.isEmpty()) {
            customerRepository.findByPhone(phone).ifPresent(existing -> {
                if (excludeCustomerId == null || !existing.getId().equals(excludeCustomerId)) {
                    throw new BadRequestException("Số điện thoại đã được sử dụng");
                }
            });
        }

        if (email != null && !email.isEmpty()) {
            customerRepository.findByEmail(email).ifPresent(existing -> {
                if (excludeCustomerId == null || !existing.getId().equals(excludeCustomerId)) {
                    throw new BadRequestException("Email đã được sử dụng");
                }
            });
        }

        if (taxCode != null && !taxCode.isEmpty()) {
            customerRepository.findByTaxCode(taxCode).ifPresent(existing -> {
                if (excludeCustomerId == null || !existing.getId().equals(excludeCustomerId)) {
                    throw new BadRequestException("Mã số thuế đã được sử dụng");
                }
            });
        }
    }

    /**
     * Map Entity sang Response DTO
     */
    private CustomerResponse mapToResponse(Customer customer) {
        return CustomerResponse.builder().id(customer.getId()).name(customer.getName()).phone(customer.getPhone())
                .email(customer.getEmail()).address(customer.getAddress()).customerType(customer.getCustomerType())
                .isActive(customer.getIsActive()).createdDate(customer.getCreatedDate())
                .companyName(customer.getCompanyName()).taxCode(customer.getTaxCode()).notes(customer.getNotes())
                .taxCode(customer.getTaxCode()).updatedDate(customer.getUpdatedDate())
                .createdByName(customer.getCreatedBy() != null ? customer.getCreatedBy().getFullName() : null).build();
    }
}
