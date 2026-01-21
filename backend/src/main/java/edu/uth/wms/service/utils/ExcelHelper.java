package edu.uth.wms.service.utils;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.internal.OutboundExcelItem;
import edu.uth.wms.dto.internal.PoExcelItem;
import edu.uth.wms.dto.request.ProductRequest;

@Component
public class ExcelHelper {
    public static String TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // Kiểm tra định dạng file
    public boolean hasExcelFormat(MultipartFile file) {
        return TYPE.equals(file.getContentType());
    }

    // Hàm đọc Excel cho ProductRequest (DTO)
    public List<ProductRequest> excelToProducts(InputStream is) {
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            List<ProductRequest> products = new ArrayList<>();
            int rowNumber = 0;

            while (rows.hasNext()) {
                Row currentRow = rows.next();

                // Bỏ qua header
                if (rowNumber == 0) {
                    rowNumber++;
                    continue;
                }

                ProductRequest product = new ProductRequest();
                // product.setSku(getCellValue(currentRow, 1));
                product.setName(getCellValue(currentRow, 1));
                product.setBarcode(getCellValue(currentRow, 2));
                product.setImageUrl(getCellValue(currentRow, 3));
                product.setUnit(getCellValue(currentRow, 4));
                // Price: cần parse sang BigDecimal
                String priceStr = getCellValue(currentRow, 5);
                if (priceStr != null && !priceStr.isEmpty()) {
                    product.setPrice(new BigDecimal(priceStr));
                }

                // CategoryId: parse sang Long
                String categoryIdStr = getCellValue(currentRow, 6);
                if (categoryIdStr != null && !categoryIdStr.isEmpty()) {
                    product.setCategoryId(Long.parseLong(categoryIdStr));
                }

                products.add(product);
            }
            return products;
        } catch (IOException e) {
            throw new RuntimeException("Fail to parse Excel file: " + e.getMessage());
        }
    }

    // Helper an toàn để lấy giá trị String từ ô
    private String getCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell);
    }

    // Hàm đọc Excel Đơn nhập hàng (Purchase Order)
    public List<PoExcelItem> excelToPoItems(InputStream is) {
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0); // Lấy sheet đầu tiên
            Iterator<Row> rows = sheet.iterator();
            List<PoExcelItem> items = new ArrayList<>();

            int rowNumber = 0;
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                // Bỏ qua header dòng 0
                if (rowNumber == 0) {
                    rowNumber++;
                    continue;
                }

                PoExcelItem item = new PoExcelItem();

                item.setProductName(getCellValue(currentRow, 0));
                // Giả định cột 1 là SKU
                item.setSku(getCellValue(currentRow, 1));

                // Giả định cột 2 là Số lượng
                String qtyStr = getCellValue(currentRow, 2);
                if (qtyStr != null && !qtyStr.isEmpty()) {
                    // Parse double về int (do excel hay lưu số là double 5.0)
                    try {
                        double d = Double.parseDouble(qtyStr);
                        item.setQuantity((int) d);
                    } catch (NumberFormatException e) {
                        item.setQuantity(0);
                    }
                } else {
                    item.setQuantity(0);
                }

                if (item.getSku() != null && !item.getSku().isEmpty() && item.getQuantity() > 0) {
                    items.add(item);
                }
            }
            return items;
        } catch (IOException e) {
            throw new RuntimeException("Lỗi đọc file Excel PO: " + e.getMessage());
        }
    }

    public List<OutboundExcelItem> excelToOutboundItems(InputStream is) {
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0); // Lấy sheet đầu tiên
            Iterator<Row> rows = sheet.iterator();
            List<OutboundExcelItem> items = new ArrayList<>();

            int rowNumber = 0;
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                // Bỏ qua header dòng 0
                if (rowNumber == 0) {
                    rowNumber++;
                    continue;
                }

                OutboundExcelItem item = new OutboundExcelItem();

                item.setProductName(getCellValue(currentRow, 0));

                // Giả định cột 1 là SKU
                item.setSku(getCellValue(currentRow, 1));

                // Giả định cột 2 là Số lượng
                String qtyStr = getCellValue(currentRow, 2);
                if (qtyStr != null && !qtyStr.isEmpty()) {
                    // Parse double về int (do excel hay lưu số là double 5.0)
                    try {
                        double d = Double.parseDouble(qtyStr);
                        item.setQuantity((int) d);
                    } catch (NumberFormatException e) {
                        item.setQuantity(0);
                    }
                } else {
                    item.setQuantity(0);
                }

                if (item.getSku() != null && !item.getSku().isEmpty() && item.getQuantity() > 0) {
                    items.add(item);
                }
            }
            return items;
        } catch (IOException e) {
            throw new RuntimeException("Lỗi đọc file Excel PO: " + e.getMessage());
        }
    }
}