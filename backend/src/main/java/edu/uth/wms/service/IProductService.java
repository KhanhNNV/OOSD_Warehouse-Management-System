package edu.uth.wms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.web.multipart.MultipartFile;
import edu.uth.wms.dto.response.ProductScanResponse;
import edu.uth.wms.dto.response.VerifyResponse;
import edu.uth.wms.dto.request.ProductRequest;
import edu.uth.wms.dto.request.ProductVerifyRequest;
import edu.uth.wms.dto.response.ProductResponse;
import edu.uth.wms.dto.response.ProductScanResponse;

public interface IProductService {

    List<ProductResponse> getAllProducts();

    List<ProductResponse> getProductsByCategory(Long categoryId);

    ProductResponse getProductById(Long id);

    ProductResponse createProduct(ProductRequest dto, MultipartFile imageFile);

    void importProductFromExcel(MultipartFile file);

    ProductResponse updateProduct(Long id, ProductRequest dto, MultipartFile imageFile);

    void deleteProduct(Long id);

    Optional<ProductScanResponse> getProductByBarcode(String barcode);

    VerifyResponse verifyProductMatch(ProductVerifyRequest request);

}
