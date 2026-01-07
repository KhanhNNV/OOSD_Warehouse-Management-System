package edu.uth.wms.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Sử dụng Entity tên Suppliers như bạn định nghĩa

import edu.uth.wms.dto.request.SupplierRequest;
import edu.uth.wms.dto.response.SupplierResponse;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.Suppliers;
import edu.uth.wms.repository.ISupplierRepository;
import edu.uth.wms.service.ISupplierService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements ISupplierService {

    private final ISupplierRepository supplierRepository;

    @Override
    public List<SupplierResponse> getAllSuppliers() {
        // Stream entity -> Map sang Response -> Collect to List
        return supplierRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SupplierResponse createSupplier(SupplierRequest dto) {
        // 1. Validation Logic: Master Data không được trùng thông tin liên lạc
        if (supplierRepository.existsByEmail(dto.getEmail())) {
            throw new ResourceNotFoundException("Email '" + dto.getEmail() + "' đã được sử dụng bởi NCC khác.");
        }
        if (supplierRepository.existsByPhone(dto.getPhone())) {
            throw new ResourceNotFoundException("Số điện thoại '" + dto.getPhone() + "' đã được sử dụng.");
        }

        // 2. Mapping DTO -> Entity (Dùng Builder cho gọn)
        Suppliers supplier = Suppliers.builder().name(dto.getName()).email(dto.getEmail()).phone(dto.getPhone())
                .address(dto.getAddress()).build();

        // 3. Save
        Suppliers saved = supplierRepository.save(supplier);
        return toDto(saved);
    }

    @Override
    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest dto) {
        // 1. Tìm bản ghi cũ
        Suppliers existingSupplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Nhà cung cấp ID: " + id));

        // 2. Check trùng lặp khi Update (Chỉ check nếu email/phone thay đổi)
        // Nếu email mới khác email cũ VÀ email mới đã tồn tại trong DB -> Lỗi
        if (!existingSupplier.getEmail().equals(dto.getEmail()) && supplierRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email cập nhật đã tồn tại!");
        }
        if (!existingSupplier.getPhone().equals(dto.getPhone()) && supplierRepository.existsByPhone(dto.getPhone())) {
            throw new RuntimeException("SĐT cập nhật đã tồn tại!");
        }

        // 3. Update dữ liệu (Vì dùng @Setter(AccessLevel.NONE) ở ID, ta chỉ set các
        // field khác)
        // Lưu ý: Entity Suppliers của bạn phải có Setter cho Name, Email, Phone hoặc
        // dùng Builder/Update method
        // Giả sử bạn đã mở lại Setter hoặc tạo method update thông tin:
        Suppliers updatedData = Suppliers.builder().id(existingSupplier.getId()) // Giữ ID cũ (Cần xử lý chỗ này nếu
                                                                                 // Builder tạo object mới)
                .name(dto.getName()).email(dto.getEmail()).phone(dto.getPhone()).address(dto.getAddress()).build();

        // Cách tốt nhất với JPA là set trực tiếp trên object existing (Cần Setter trong
        // Entity)
        // existingSupplier.setName(dto.getName()); ...
        // Ở đây tôi giả định repository.save đè lên ID cũ.
        Suppliers saved = supplierRepository.save(updatedData);

        return toDto(saved);
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new ResourceNotFoundException("Nhà cung cấp không tồn tại");
        }
        // Logic nghiệp vụ: Nếu NCC này đã có đơn hàng (Purchase Order) thì không cho
        // xóa
        // Bạn có thể try-catch DataIntegrityViolationException từ DB nếu có Foreign Key
        // Constraint
        try {
            supplierRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Không thể xóa NCC này vì đã có dữ liệu giao dịch liên quan.");
        }
    }

    // Helper method để map data (tránh lặp code)
    private SupplierResponse toDto(Suppliers s) {
        return SupplierResponse.builder().id(s.getId()).name(s.getName()).email(s.getEmail()).phone(s.getPhone())
                .address(s.getAddress()).build();
    }
}