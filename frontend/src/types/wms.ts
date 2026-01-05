// Stocktake Types
export interface StocktakeSession {
  id: string;
  name: string;
  type: "zone" | "category";
  zone?: string;
  category?: string;
  status: "draft" | "open" | "completed";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  totalItems: number;
  countedItems: number;
  varianceCount: number;
}

export interface StocktakeItem {
  id: string;
  sessionId: string;
  productId: string;
  productName: string;
  sku: string;
  location: string;
  systemQty: number;
  actualQty: number | null;
  variance: number | null;
  status: "pending" | "counted" | "recount" | "approved" | "adjusted";
  countedBy?: string;
  countedAt?: string;
  notes?: string;
}

// Inbound Types
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  status: "pending" | "receiving" | "putaway" | "completed";
  createdAt: string;
  expectedDate: string;
  totalItems: number;
  receivedItems: number;
  hasVariance: boolean;
}

export interface POItem {
  id: string;
  poId: string;
  productName: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
  variance: number;
  status: "pending" | "received" | "variance";
}

// Outbound Types
export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status:
    | "pending"
    | "allocated"
    | "picking"
    | "packed"
    | "shipped"
    | "completed";
  createdAt: string;
  totalItems: number;
  allocatedItems: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  physicalQty: number;
  allocatedQty: number;
  availableQty: number;
  location: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  type: "inbound" | "outbound" | "stocktake" | "adjustment";
  action: string;
  description: string;
  user: string;
  timestamp: string;
}

// User Management Types
export type UserRole = "admin" | "manager" | "staff" | "accountant";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: "active" | "locked";
  createdAt: string;
  lastLogin?: string;
  phone?: string;
}

// Warehouse Location Types
export interface Zone {
  id: string;
  code: string;
  name: string;
  description?: string;
  shelfCount: number;
  createdAt: string;
}

export interface Shelf {
  id: string;
  zoneId: string;
  code: string;
  name: string;
  capacity: number;
  currentStock: number;
  qrCode?: string;
}

// Master Data Types
export interface Product {
  supplierId: number;
  id: string | number;
  sku: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  barcode?: string;
  unit: string;
  price: number;
  description?: string;
  imageUrl?: string;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: number;
  code?: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address?: string;
  status?: "active" | "inactive";
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
  createdAt?: string;
}

// Form Types
export interface ProductFormData {
  sku: string;
  name: string;
  barcode?: string;
  categoryId: string;
  unit: string;
  price: number;
  description?: string;
  imageFile?: File | null;
}

export interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  contactPerson?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

// Import Types
export interface ImportResult {
  success: boolean;
  message: string;
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

// Accountant Types
export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
}

export interface InventoryValue {
  category: string;
  totalQty: number;
  totalValue: number;
  averagePrice: number;
}
