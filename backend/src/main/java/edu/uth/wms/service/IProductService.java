package edu.uth.wms.service;

import java.util.Optional;

import edu.uth.wms.dto.response.ProductScanResponse;


public interface IProductService {
    Optional<ProductScanResponse> getProductByBarcode(String barcode);
}
