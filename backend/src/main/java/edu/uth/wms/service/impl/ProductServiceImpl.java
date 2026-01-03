package edu.uth.wms.service.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import edu.uth.wms.dto.response.ProductScanResponse;
import edu.uth.wms.model.Products;
import edu.uth.wms.repository.IProductRepository;
import edu.uth.wms.service.IProductService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements IProductService {
    private final IProductRepository productRepository;

    @Override
    public Optional<ProductScanResponse> getProductByBarcode(String barcode) {
        Optional<Products> productScan = productRepository.findByBarcode(barcode);
        return productScan.map(p -> ProductScanResponse.builder()
                .productId(String.valueOf(p.getId()))
                .sku(p.getSku())
                .productName(p.getName())
                .imageProduct(p.getImage_url())
                .barcode(p.getBarcode())
                .unit(p.getUnit())
                .build());
    }
}
