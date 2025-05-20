
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
}

export interface TransferRequest {
  product_id: string;
  quantity: number;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
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
