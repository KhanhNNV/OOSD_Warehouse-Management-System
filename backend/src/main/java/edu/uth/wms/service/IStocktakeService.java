package edu.uth.wms.service;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * SERVICE INTERFACE - KIỂM KÊ KHO
 */
public interface IStocktakeService {

    /**
     * - <b>1. Lấy danh sách tất cả các phiên kiểm kê.</b><br>
     *  Dùng cho màn hình danh sách chính.<br>
     */
    Page<StocktakeSessionResponse> getAllSessions(int page, int size);

    /**
     * - <b>2. Lấy chi tiết một phiên kiểm kê.</b><br>
     *  Bao gồm thông tin chung và danh sách chi tiết hàng hóa bên trong.<br>
     */
    StocktakeSessionDetailResponse getSessionDetail(Long sessionId);

    /**
     * - <b>3. Tạo một phiên kiểm kê mới (Trạng thái DRAFT)</b>.<br>
     *  Chỉ mới tạo thông tin phiên.<br>
     *  Hệ thống sẽ tự động tìm các Location trong Zone để tạo sẵn các Task
     * (Assignment).<br>
     *  Lúc này chưa snapshot tồn kho (số lượng tồn kho hệ thống chưa được ghi
     * lại).<br>
     */
    StocktakeSessionResponse createSession(String username, CreateStocktakeRequest request);

    /**
     * - <b>4. Xóa phiên kiểm kê.</b><br>
     *  Chỉ xóa được khi phiên đang ở trạng thái DRAFT.<br>
     */
    void deleteSession(Long sessionId);

    /**
     * - <b>5. Mở phiên kiểm kê (DRAFT -> IN_PROGRESS).</b><br>
     *  Chỉ mới tạo thông tin phiên.<br>
     *  Kích hoạt phiên để Staff bắt đầu nhìn thấy việc.<br>
     *  Đánh dấu thời gian bắt đầu.<br>
     */
    StocktakeSessionResponse openSession(Long sessionId);

    /**
     * - <b>6. Đóng phiên kiểm kê thủ công (IN_PROGRESS -> COMPLETED).</b><br>
     * Dùng khi Manager muốn kết thúc sớm hoặc cưỡng chế đóng phiên.
     */
    StocktakeSessionResponse closeSession(Long sessionId);

    /**
     * - <b>10. Xem báo cáo chênh lệch (Variance Report).</b>.<br>
     * So sánh số lượng Tồn kho (lúc bắt đầu đếm) vs Số lượng Thực tế (Staff đếm).<br>
     * Hàm này <b>CHỈ XEM</b>, không làm thay đổi dữ liệu kho.<br>
     */
    VarianceReportResponse getVarianceReport(Long sessionId);

    /**
     * - <b>11. Duyệt và Điều chỉnh kho (Approve & Adjust).</b>.<br>
     *  Manager xác nhận kết quả kiểm kê là đúng.Hệ thống sẽ <b>CẬP NHẬT</b> số lượng tồn kho thực tế vào bảng Inventory.<br>
     *  Tạo giao dịch kho (Transaction) loại STOCKTAKE_ADJUST.
     */
    StocktakeSessionResponse approveAdjustment(String username, ApproveAdjustmentRequest request);

    /**
     * - <b>12. Yêu cầu đếm lại (Re-count)</b>.<br>
     *  Nếu Manager thấy số liệu nghi ngờ, dùng hàm này để reset kết quả đếm của dòng đó về 0.<br>
     *  Staff sẽ phải vào đếm lại dòng này.
     */
    void requestRecount(Long detailId, String notes);

    /**
     * - <b>13. Lấy danh sách công việc (Assignment) của Staff</b>.<br>
     * Staff chỉ thấy các kệ (Location) đang Open hoặc các kệ mình đang làm dở.
     */
    List<StocktakeShelfAssignmentResponse> getStaffAssignments(String username);

    /**
     * - <b>14. Bắt đầu đếm một kệ (Start Assignment).</b>.<br>
     * <b>QUAN TRỌNG:</b> Khi gọi hàm này, hệ thống sẽ "Chụp ảnh" (Snapshot) tồn kho hiện tại của kệ đó.
     *  Chuyển trạng thái kệ sang IN_PROGRESS.<br>
     * Trả về danh sách sản phẩm để Staff nhập số lượng (Blind Count - không hiện số tồn).
     */
    List<StocktakeBlindCountResponse> startAssignment(String username, Long assignmentId);

    /**
     * - <b>15. Hoàn tất đếm kệ (Complete Assignment)</b>.<br>
     *  Staff gửi danh sách số lượng thực tế đếm được lên.<br>
     *  Hệ thống lưu lại kết quả đếm. <br>
     * 
     */
    void completeAssignment(String username, Long assignmentId, SubmitCountsRequest request);

    /**
     * - <b>16. Kiểm tra vị trí có đang bị khóa bởi kiểm kê không.</b>.<br>
     *  Dùng cho các nghiệp vụ khác (như Inbound/Outbound) để chặn không cho xuất nhập
     * khi kệ này đang trong quá trình kiểm kê.<br>
     */
    boolean isLocationLocked(String locationCode);

}


    // ==================MẤY CÁI HÀM KHÔNG CẦN THIẾT SO VỚI LOGIC HIỆN TẠI
    // NỮA==========================
    // ! 7. Lấy danh sách blind count cho staff
    // List<StocktakeBlindCountResponse> getBlindCountList(Long sessionId);
    // ! 8. Staff nhập số lượng (blind count)
    // StocktakeDetailResponse submitCount(String username,
    // CountStocktakeItemRequest request);
    // ! 9. Submit nhiều sản phẩm cùng lúc
    // List<StocktakeDetailResponse> submitCounts(String username,
    // SubmitCountsRequest request);
    
    // =================================================================================================