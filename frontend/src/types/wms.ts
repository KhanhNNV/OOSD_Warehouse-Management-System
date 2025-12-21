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
  status: "pending" | "allocated" | "picking" | "packed" | "shipped" | "completed";
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

// Warehouse Structure Types
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
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  image?: string;
  description?: string;
  costPrice: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: "active" | "inactive";
  createdAt: string;
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
