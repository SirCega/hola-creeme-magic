
// Define all inventory-related types in this file

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  cost: number;
  sku: string;
  stock: number;
  stock_1?: number;
  stock_2?: number;
  stock_3?: number;
  unit: string;
  status: string;
  box_qty: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
  // Additional properties needed by the application
  threshold?: number;
  mainWarehouse?: number;
  warehouse1?: number;
  warehouse2?: number;
  warehouse3?: number;
}

export interface TransferRequest {
  product_id: string;
  quantity: number;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
  // Additional properties used in the app
  productId?: string;
  sourceWarehouse?: string;
  destinationWarehouse?: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  destination_warehouse_id?: string;
  quantity: number;
  movement_type: string;
  date: string;
  notes?: string;
  product?: {
    name: string;
  };
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  status: string;
}
