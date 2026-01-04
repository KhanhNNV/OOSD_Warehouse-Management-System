package edu.uth.wms.controller;

import edu.uth.wms.service.IBarcodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/barcode")
public class BarcodeController {

    // Inject Interface thay vì Class cụ thể
    @Autowired
    private IBarcodeService barcodeService;

    // API tạo mã vạch
    // VD: GET /api/barcode/generate?code=A-S01-01
    @GetMapping("/generate")
    public ResponseEntity<?> generateBarcode(@RequestParam("code") String code) {
        String base64Image = barcodeService.generateBarcodeBase64(code);

        if (base64Image != null) {
            // Trả về JSON chứa chuỗi Base64
            Map<String, String> response = Collections.singletonMap("barcodeBase64", base64Image);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Không thể tạo mã vạch. Vui lòng kiểm tra lại mã đầu vào.");
        }
    }
}