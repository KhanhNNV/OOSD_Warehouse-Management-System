// 5. Outbound Order Status (Quy trình xuất hàng)
export type SOStatus =
    | 'NEW'        // Mới từ kinh doanh đổ về
    | 'ALLOCATED'  // Hệ thống đã "xí phần" hàng trên kệ
    | 'PICKING'    // Nhân viên đang đi nhặt
    | 'PACKED'     // Đóng thùng xong
    | 'SHIPPED'   // Giao cho shipper
    | "CANCELLED";    // Đã hủy




export interface OutboundDetailResponse {
    id: number;
    productId: number;
    productSku: string;
    productName: string;
    requestedQty: number;
    allocatedQty: number; // Số lượng thực xuất
}

export interface OutboundOrderResponse {
    id: number;
    orderNumber: string;
    status: string;

    customerName: string;
    toName: string;
    toPhone: string;
    toAddress: string;

    createdDate: string;
    createdByName: string;

    totalItems: number;
    totalQuantity: number;

    // ✅ Danh sách chi tiết để hiện lên bảng
    details: OutboundDetailResponse[];
}
export interface SalesOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    status: SOStatus;
    createdAt: string;
    totalItems: number;
    allocatedItems: number; // Số lượng đã giữ chỗ thành công
}

export interface OutboundStats {
    new: number;
    processing: number; // Gom nhóm Allocated + Picking + Packed
    shipped: number;
}

// ========================================
// 1. OUTBOUND ORDER (Đơn hàng xuất)
// ========================================
export interface OutboundOrder {
  id: number;
  orderNumber: string;
  status: SOStatus;

  // Thông tin khách hàng
  customerName?: string;
  toName: string;
  toPhone: string;
  toAddress: string;

  // Thống kê
  totalItems: number;      // Tổng số loại sản phẩm
  totalQuantity: number;   // Tổng số lượng

  createdDate: string;

  //Tên nhân viên phụ trách
  assignedPickerName?:string;
  assignedPickerId?: number;      
  isAssignedToCurrentUser: boolean;

  // Chi tiết sản phẩm
  details?: OutboundDetail[];
}

// ========================================
// 2. CHI TIẾT SẢN PHẨM TRONG ĐƠN
// ========================================
export interface OutboundDetail {
  productId: number;
  productSku: string;
  productName: string;
  requestedQty: number;    // Số lượng yêu cầu
  allocatedQty: number;    // Số lượng đã phân bổ
}

// ========================================
// 3. TẠO ĐƠN HÀNG MỚI (Request)
// ========================================
export interface CreateOutboundRequest {
  customerId?: number;
  toName: string;
  toPhone: string;
  toAddress: string;
  items: {
    productId: number;
    requestedQty: number;
  }[];
}

// ========================================
// 4. PICKING INSTRUCTION (Chỉ dẫn lấy hàng)
// ========================================
export interface PickingInstruction {
  orderId: number;
  orderNumber: string;
  algorithm: string;  // "FIFO (First In First Out)"
  tasks: PickingTask[];
}

export interface PickingTask {
  productId: number;
  productSku: string;
  productName: string;
  totalNeeded: number;
  locations: LocationPickingDetail[];
}

export interface LocationPickingDetail {
    inventoryId: number;
  locationCode: string;        // A-01-01
  qtyToPickFromHere: number;   // Lấy bao nhiêu từ kệ này
  availableQty: number;        // Tồn kho hiện tại
    pickedQty?: number;
  expiryDate?: string;
  manufactureDate?: string;
}
export interface ScanPickRequest {
    orderId: number;
    inventoryId: number; // <--- Thêm dòng này
    locationCode: string;
    quantity: number;
}

export interface PickingTaskState {
    inventoryId: number; // <--- Thêm dòng này
    productId: number;
    productName: string;
    productSku: string;
    locationCode: string;
    qtyToPick: number;
    qtyAvailable: number;
}

export interface ScanPickResponse {
    success: boolean;
    message: string;
    currentInventory: number;
    pickedQty?: number;         // Số lượng Actual (Đã lấy được)
}

// ========================================
// 5. XÁC NHẬN XUẤT KHO (Request)
// ========================================
export interface ConfirmPickingRequest {
  outboundOrderId: number;
  pickedItems: {
    productId: number;
    locationCode: string;
    quantity: number;
  }[];
}

// ========================================
// 6. PHIẾU XUẤT KHO (Response)
// ========================================
export interface OutboundNote {
  noteCode: string;
  orderNumber: string;
  status: string;
  exportedDate: string;
  items: {
    productName: string;
    locationCode: string;
    quantity: number;
  }[];
}

// ========================================
// 7. CẤU HÌNH HỆ THỐNG
// ========================================
export interface SystemConfig {
  currentAlgorithm: "FIFO" | "FEFO";
  updatedBy: string;
  updatedAt: string;
}

export interface UpdateAlgorithmRequest {
  algorithm: "FIFO" | "FEFO";
}


// ========================================
// 9. HELPERS
// ========================================
export const getStatusColor = (status: SOStatus) => {
  const colors: Record<SOStatus, string> = {
    NEW: "bg-blue-100 text-blue-700 border-blue-200",
    ALLOCATED: "bg-purple-100 text-purple-700 border-purple-200",
    PICKING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    PACKED: "bg-orange-100 text-orange-700 border-orange-200",
    SHIPPED: "bg-green-100 text-green-700 border-green-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200"
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

export const getStatusLabel = (status: SOStatus) => {
  const labels: Record<SOStatus, string> = {
    NEW: "Mới tạo",
    ALLOCATED: "Đã giữ chỗ",
    PICKING: "Đang lấy",
    PACKED: "Đã đóng gói",
    SHIPPED: "Đã giao",
    CANCELLED: "Đã hủy"
  };
  return labels[status] || status;
};


export interface LocalPickingResult {
    outboundDetailId: number; // ID của dòng outbound_details
    productId: number;
    locationId: number;
    actualQty: number;        // Số lượng thực tế nhân viên lấy
    isFlagged: boolean;       // Có báo lỗi/thiếu hàng không
    note?: string;            // Ghi chú nếu có
    timestamp: number;        // Thời gian hoàn thành
}

// Định nghĩa cấu trúc lưu trữ cho cả đơn hàng
// Key LocalStorage sẽ là: "picking_results_{orderId}"
export interface OrderPickingSession {
    [outboundDetailId: number]: LocalPickingResult;
}
//=============Đăng kí cho staff ==================
export interface RegisterResponse {
  success: boolean;
  message: string;
}

