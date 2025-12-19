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
