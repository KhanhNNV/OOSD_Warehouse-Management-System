package edu.uth.wms.service.impl;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.request.ProductRequest;
import edu.uth.wms.dto.request.ProductVerifyRequest;
import edu.uth.wms.dto.response.ProductResponse;
import edu.uth.wms.dto.response.ProductScanResponse;
import edu.uth.wms.dto.response.VerifyResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.Categories;
import edu.uth.wms.model.Products;
import edu.uth.wms.repository.ICategoryRepository;
import edu.uth.wms.repository.IProductRepository;
import edu.uth.wms.service.IProductService;
import edu.uth.wms.service.utils.ExcelHelper;
import edu.uth.wms.service.utils.FileStorageService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements IProductService {

    final IProductRepository productRepository;
    final ICategoryRepository categoryRepository;
    final FileStorageService fileStorageService;
    final ExcelHelper excelHelper;

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getProductsByCategory(Long categoryId) {
        return productRepository.findAll().stream().filter(product -> product.getCategory().getId().equals(categoryId))
                .map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest req, MultipartFile imageFile) {

        // 1. Validation Logic
        if (productRepository.existsBySku(req.getSku())) {
            throw new ResourceNotFoundException("Mã SKU " + req.getSku() + " đã tồn tại!");
        }
        if (req.getBarcode() != null && productRepository.existsByBarcode(req.getBarcode())) {
            throw new ResourceNotFoundException("Mã Barcode " + req.getBarcode() + " đã tồn tại!");
        }

        // 2. Tìm Category & Supplier theo ID
        Categories category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Category ID: " + req.getCategoryId()));

        // Mở comment nếu đã có Supplier Repo
        // Suppliers supplier = supplierRepo.findById(req.getSupplierId())
        // .orElseThrow(() -> new RuntimeException("Không tìm thấy Supplier ID: " +
        // req.getSupplierId()));

        // 3. Mapping Data (Master Data - Chưa dính đến Inventory/Kho)
        Products product = new Products();
        product.setSku(req.getSku());
        product.setName(req.getName());
        product.setBarcode(req.getBarcode());
        product.setUnit(req.getUnit());
        product.setPrice(req.getPrice());

        // Setup quan hệ
        product.setCategory(category);
        // product.setSupplier(supplier);
        // product.setActive(true);

        // 4. upload ảnh
        // Trường hợp 1: Người dùng upload file từ máy tính
        if (imageFile != null && !imageFile.isEmpty()) {
            String fileName = fileStorageService.storeFile(imageFile);
            product.setImage_url(fileName);
        }
        // Trường hợp 2: Người dùng gửi link ảnh (như bạn đang test postman)
        else if (req.getImageUrl() != null && !req.getImageUrl().trim().isEmpty()) {
            product.setImage_url(req.getImageUrl());
        }

        // 5. Lưu xuống DB
        Products savedProduct = productRepository.save(product);

        // 6. Map Entity -> Response DTO
        return toDto(savedProduct);
    }

    @Override
    @Transactional
    public void importProductFromExcel(MultipartFile file) {
        // 1. Kiểm tra định dạng bằng Helper
        if (!excelHelper.hasExcelFormat(file)) {
            throw new BadRequestException("File không đúng định dạng Excel (.xlsx)");
        }

        try {
            // 2. Dùng Helper để giải mã file thành List<Request>
            List<ProductRequest> productRequests = excelHelper.excelToProducts(file.getInputStream());

            // 3. Duyệt qua danh sách và lưu vào DB
            for (ProductRequest req : productRequests) {

                // Nếu sản phẩm đã tồn tại thì bỏ qua (hoặc update tùy logic)
                if (productRepository.existsBySku(req.getSku())) {
                    continue;
                }

                // Tận dụng logic mapping có sẵn (nhưng cần cẩn thận vì Excel ko có file ảnh
                // Multipart)
                saveProductFromExcel(req);
            }

        } catch (IOException e) {
            throw new BadRequestException("Lỗi khi đọc file Excel: " + e.getMessage());
        }
    }

    // Hàm phụ để lưu sản phẩm từ Excel (Vì Excel dùng ID số, ko phải Object)
    private void saveProductFromExcel(ProductRequest req) {
        Products p = new Products();
        p.setSku(req.getSku());
        p.setName(req.getName());
        p.setBarcode(req.getBarcode());
        p.setUnit(req.getUnit());
        p.setPrice(req.getPrice());
        p.setImage_url(req.getImageUrl()); // Lấy link ảnh dạng text trong excel (nếu có)

        // Map Category ID
        if (req.getCategoryId() != null) {
            Categories cat = categoryRepository.findById(req.getCategoryId()).orElse(null);
            p.setCategory(cat);
        }

        // Map Supplier ID
        // if (req.getSupplierId() != null) {
        // Suppliers sup =
        // supplierRepository.findById(req.getSupplierId()).orElse(null);
        // p.setSupplier(sup);
        // }

        // p.setActive(true);
        productRepository.save(p);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest dto, MultipartFile imageFile) {
        Products product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Cập nhật thông tin từ DTO
        product.setSku(dto.getSku());
        product.setName(dto.getName());
        product.setBarcode(dto.getBarcode());
        product.setUnit(dto.getUnit());
        product.setPrice(dto.getPrice());

        if (imageFile != null && !imageFile.isEmpty()) {
            String fileName = fileStorageService.storeFile(imageFile);
            product.setImage_url(fileName);
        } else if (dto.getImageUrl() != null && !dto.getImageUrl().trim().isEmpty()) {
            product.setImage_url(dto.getImageUrl().trim());
        }

        // Cập nhật Category nếu cần
        if (dto.getCategoryId() != null) {
            Categories cat = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(cat);
        }

        return toDto(productRepository.save(product));
    }

    @Override
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    @Override
    public Optional<ProductScanResponse> getProductByBarcode(String barcode) {
        Optional<Products> productScan = productRepository.findByBarcode(barcode);
        return productScan.map(p -> ProductScanResponse.builder().productId(String.valueOf(p.getId())).sku(p.getSku())
                .productName(p.getName()).imageProduct(p.getImage_url()).barcode(p.getBarcode()).unit(p.getUnit())
                .build());
    }

    private ProductResponse toDto(Products product) {
        return ProductResponse.builder().id(product.getId()).name(product.getName()).sku(product.getSku())
                .barcode(product.getBarcode()).price(product.getPrice()).imageUrl(product.getImage_url())
                .unit(product.getUnit())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null).build();
    }

    @Override
    public VerifyResponse verifyProductMatch(ProductVerifyRequest request) {
        Products targetProduct = productRepository.findById(request.getTargetProductId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy sản phẩm hệ thống yêu cầu (ID: " + request.getTargetProductId() + ")"));
        
        String systemProductSku = targetProduct.getSku();

        String systemProductBarcode = targetProduct.getBarcode() != null ? targetProduct.getBarcode().trim() : "";
        String userScan = request.getScannedProductCode() != null ? request.getScannedProductCode().trim() : "";

        boolean isMatch = systemProductBarcode.equalsIgnoreCase(userScan);

        return VerifyResponse.builder()
                .isMatched(isMatch)
                .message(isMatch ? "Sản phẩm chính xác!" : "Sai sản phẩm! Cần tìm sản phẩm: " + systemProductSku)
                .systemData(systemProductBarcode)
                .build();

    }


    
}
