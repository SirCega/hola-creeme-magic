
export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  description?: string;
  image_url?: string;
  box_qty: number;
  threshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface TransferRequest {
  productId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
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
}
