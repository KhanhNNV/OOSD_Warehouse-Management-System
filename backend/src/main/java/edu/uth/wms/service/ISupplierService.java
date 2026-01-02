package edu.uth.wms.service;

import java.util.List;

import edu.uth.wms.dto.request.SupplierRequest;
import edu.uth.wms.dto.response.SupplierResponse;

public interface ISupplierService {
    List<SupplierResponse> getAllSuppliers();

    SupplierResponse createSupplier(SupplierRequest dto);

    SupplierResponse updateSupplier(Long id, SupplierRequest dto);

    void deleteSupplier(Long id);

}
