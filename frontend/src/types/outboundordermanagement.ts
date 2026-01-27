// Order Status
export type OrderStatus =
  | 'NEW'
  | 'ALLOCATED'
  | 'PICKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

// Customer Type
export type CustomerType = 
  | 'RETAIL'
  | 'WHOLESALE'
  | 'DISTRIBUTOR'
  | 'AGENT'
  | 'CORPORATE';

// Detail trong đơn hàng
export interface OutboundDetail {
  id: number;
  productName: string;
  productSku: string;
  requestedQty: number;
  allocatedQty: number;
}

// Outbound Order
export interface OutboundOrder {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  toName: string;
  toPhone: string;
  toAddress: string;
  createdDate: string;
  createdByName: string;
  assignedPickerName: string | null;
  exportedDate?: string;
  isAssignedToCurrentUser?: boolean;
  details: OutboundDetail[];
}

// Request tạo đơn mới
export interface CreateOutboundOrderRequest {
  customerId: number;
  toName: string;
  toPhone: string;
  toAddress: string;
  items: {
    productId: number;
    quantity: number;
  }[];
}

// Request import từ Excel
export interface ImportOutboundOrderRequest {
  customerId: number;
  toName: string;
  toPhone: string;
  toAddress: string;
  file: File;
}

// Filter params
export interface OutboundOrderFilterParams {
  status?: OrderStatus;
  customerId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
}

// // Customer
export interface Customer {
  id: number;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  customerType: CustomerType;
}

// Product
export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  unit: string;
}

// Stats
export interface OutboundStats {
  new: number;
  allocated: number;
  picking: number;
  completed: number;
  cancelled: number;
}
