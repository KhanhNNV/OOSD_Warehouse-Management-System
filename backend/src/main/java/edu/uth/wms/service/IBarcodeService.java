package edu.uth.wms.service;

public interface IBarcodeService {
    /**
     * Tạo mã vạch chuẩn CODE_128 từ chuỗi ký tự đầu vào.
     * @param text Mã code cần chuyển đổi (VD: "A-S01-01")
     * @return Chuỗi Base64 của ảnh PNG mã vạch, hoặc null nếu lỗi.
     */
    String generateBarcodeBase64(String text);
}