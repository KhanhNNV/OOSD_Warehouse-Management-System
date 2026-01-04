package edu.uth.wms.service.impl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.oned.Code128Writer;
import edu.uth.wms.service.IBarcodeService;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Service
public class BarcodeServiceImpl implements IBarcodeService {

    @Override
    public String generateBarcodeBase64(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        try {
            // 1. Cấu hình tạo mã vạch (Sử dụng chuẩn CODE_128 thông dụng)
            Code128Writer barcodeWriter = new Code128Writer();
            
            // Kích thước ảnh: Rộng 400px, Cao 100px (Điều chỉnh tùy nhu cầu in ấn)
            BitMatrix bitMatrix = barcodeWriter.encode(text, BarcodeFormat.CODE_128, 400, 100);

            // 2. Chuyển BitMatrix thành ảnh (byte array)
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();

            // 3. Chuyển đổi ảnh sang chuỗi Base64 để gửi về FE
            return Base64.getEncoder().encodeToString(pngData);

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}