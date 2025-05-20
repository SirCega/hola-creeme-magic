
export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  description?: string;
  image_url?: string;
  stock?: number;
  stock_1?: number;
  stock_2?: number;
  stock_3?: number;
  min_stock?: number;
  box_qty: number;
  threshold: number;
  brand?: string;
  cost?: number;
  unit?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransferRequest {
  productId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  type: string;
  notes?: string;
  created_at?: string;
  source_warehouse_id?: string;
  destination_warehouse_id?: string;
  responsible_id?: string;
  product?: Product;
}

export interface Warehouse {
  id: string;
  name: string;
  type: string;
  address?: string;
  location?: string;
  capacity?: number;
  status?: string;
}
