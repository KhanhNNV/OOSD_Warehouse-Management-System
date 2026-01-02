package edu.uth.wms.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.request.ProductRequest;
import edu.uth.wms.dto.response.ProductResponse;

public interface IProductService {

    List<ProductResponse> getAllProducts();

    List<ProductResponse> getProductsByCategory(Long categoryId);

    ProductResponse createProduct(ProductRequest dto, MultipartFile imageFile);

    void importProductFromExcel(MultipartFile file);

    ProductResponse updateProduct(Long id, ProductRequest dto, MultipartFile imageFile);

    void deleteProduct(Long id);

}
