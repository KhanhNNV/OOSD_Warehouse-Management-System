package edu.uth.wms.service;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;

import java.util.List;

/**
 * SERVICE INTERFACE - KIỂM KÊ KHO
 */
public interface IStocktakeService {

    // 1. Lấy tất cả phiên kiểm kê
    List<StocktakeSessionResponse> getAllSessions();

    // 2. Lấy chi tiết phiên kiểm kê (kèm danh sách sản phẩm)
    StocktakeSessionDetailResponse getSessionDetail(Long sessionId);

    // 3. Tạo phiên kiểm kê mới (Manager)
    StocktakeSessionResponse createSession(String username, CreateStocktakeRequest request);

    // 4. Xóa phiên
    void deleteSession(Long sessionId);

    // 5. Mở phiên (DRAFT -> IN_PROGRESS)
    StocktakeSessionResponse openSession(Long sessionId);

    // 6. Đóng phiên (IN_PROGRESS -> COMPLETED)
    StocktakeSessionResponse closeSession(Long sessionId);

    // 7. Lấy danh sách blind count cho staff
    List<StocktakeBlindCountResponse> getBlindCountList(Long sessionId);

    //! 8. Staff nhập số lượng (blind count)
    StocktakeDetailResponse submitCount(String username, CountStocktakeItemRequest request);

    //! 9. Submit nhiều sản phẩm cùng lúc
    List<StocktakeDetailResponse> submitCounts(String username, SubmitCountsRequest request);

    // 10. Lấy báo cáo chênh lệch
    VarianceReportResponse getVarianceReport(Long sessionId);

    // 11. Manager duyệt và điều chỉnh tồn kho theo kết quả kiểm kê
    StocktakeSessionResponse approveAdjustment(String username, ApproveAdjustmentRequest request);

    // 12. Yêu cầu kiểm lại (reset actual qty để staff đếm lại)
    void requestRecount(Long detailId, String notes);

    // 13. Lấy danh sách tất cả các kệ đang chờ (OPEN) HOẶC  đang thực bởi staff đó
    List<StocktakeShelfAssignmentResponse> getStaffAssignments(String username);

    // 14. Bắt đầu đếm một kệ (Assignment)
    List<StocktakeBlindCountResponse> startAssignment(String username, Long assignmentId);

    // 15. Hoàn thành một kệ
    void completeAssignment(String username, Long assignmentId, SubmitCountsRequest request);

    // 16. Kiểm tra xem một vị trí có đang bị khóa để kiểm kê không
    boolean isLocationLocked(String locationCode);

}

