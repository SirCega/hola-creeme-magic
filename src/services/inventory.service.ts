
import { supabase } from '@/integrations/supabase/client';
import { Product, Warehouse, Movement, TransferRequest, InventoryItem } from '@/types/inventory-types';

// Get all products with their stock information
export const getProducts = async (): Promise<Product[]> => {
  // This would be replaced with an actual API call to Supabase
  // For now, return dummy data
  return [
    {
      id: "1",
      name: "Ron Viejo de Caldas",
      sku: "RVC-001",
      description: "Ron añejo de 8 años",
      price: 45000,
      category: "Ron",
      threshold: 10,
      box_qty: 12,
      warehouse_quantities: {
        "w1": 50,
        "w2": 20,
        "w3": 15
      }
    },
    {
      id: "2",
      name: "Aguardiente Antioqueño",
      sku: "AA-002",
      description: "Aguardiente sin azúcar",
      price: 35000,
      category: "Aguardiente",
      threshold: 15,
      box_qty: 24,
      warehouse_quantities: {
        "w1": 80,
        "w2": 30,
        "w3": 25
      }
    },
    {
      id: "3",
      name: "Whisky Jack Daniel's",
      sku: "WJD-003",
      description: "Whisky Tennessee",
      price: 120000,
      category: "Whisky",
      threshold: 5,
      box_qty: 6,
      warehouse_quantities: {
        "w1": 12,
        "w2": 8,
        "w3": 5
      }
    },
    {
      id: "4",
      name: "Vodka Absolut",
      sku: "VA-004",
      description: "Vodka sueco",
      price: 75000,
      category: "Vodka",
      threshold: 8,
      box_qty: 12,
      warehouse_quantities: {
        "w1": 25,
        "w2": 10,
        "w3": 15
      }
    },
    {
      id: "5",
      name: "Tequila Don Julio",
      sku: "TDJ-005",
      description: "Tequila reposado premium",
      price: 180000,
      category: "Tequila",
      threshold: 5,
      box_qty: 6,
      warehouse_quantities: {
        "w1": 8,
        "w2": 4,
        "w3": 6
      }
    }
  ];
};

// Alias for backward compatibility
export const getAllProducts = getProducts;

// Get all warehouses
export const getWarehouses = async (): Promise<Warehouse[]> => {
  // This would be replaced with an actual API call
  // For now, return dummy data
  return [
    {
      id: "w1",
      name: "Bodega Principal",
      type: "principal",
      address: "Calle 80 #45-23, Medellín"
    },
    {
      id: "w2",
      name: "Bodega Norte",
      type: "secundaria",
      address: "Carrera 52 #70-30, Medellín"
    },
    {
      id: "w3",
      name: "Bodega Sur",
      type: "secundaria",
      address: "Calle 10 #43-12, Medellín"
    }
  ];
};

// Get inventory movements history
export const getMovements = async (): Promise<Movement[]> => {
  // This would be replaced with an actual API call
  // For now, return dummy data
  return [
    {
      id: "m1",
      type: "entrada",
      product_id: "1",
      warehouse_id: "w1",
      quantity: 100,
      responsible_id: "u1",
      created_at: "2023-05-10T14:30:00Z",
      product: {
        name: "Ron Viejo de Caldas",
        sku: "RVC-001"
      },
      warehouse: {
        name: "Bodega Principal"
      },
      responsible: {
        name: "Admin"
      }
    },
    {
      id: "m2",
      type: "transferencia",
      product_id: "1",
      warehouse_id: "w1",
      quantity: 20,
      source_warehouse_id: "w1",
      destination_warehouse_id: "w2",
      responsible_id: "u1",
      created_at: "2023-05-11T10:15:00Z",
      product: {
        name: "Ron Viejo de Caldas",
        sku: "RVC-001"
      },
      warehouse: {
        name: "Bodega Principal"
      },
      source_warehouse: {
        name: "Bodega Principal"
      },
      destination_warehouse: {
        name: "Bodega Norte"
      },
      responsible: {
        name: "Admin"
      }
    },
    {
      id: "m3",
      type: "salida",
      product_id: "1",
      warehouse_id: "w1",
      quantity: 10,
      responsible_id: "u1",
      created_at: "2023-05-12T16:45:00Z",
      product: {
        name: "Ron Viejo de Caldas",
        sku: "RVC-001"
      },
      warehouse: {
        name: "Bodega Principal"
      },
      responsible: {
        name: "Admin"
      }
    }
  ];
};

// Get inventory for a specific warehouse
export const getInventory = async (warehouseId?: string): Promise<InventoryItem[]> => {
  // This would be replaced with an actual API call
  return [];
};

// Add a new product
export const addProduct = async (product: Omit<Product, "id">): Promise<Product> => {
  // This would be replaced with an actual API call
  console.log("Adding product:", product);
  return {
    id: Math.random().toString(36).substring(2, 11),
    ...product
  };
};

// Update an existing product
export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  // This would be replaced with an actual API call
  console.log("Updating product:", id, productData);
  return {
    id,
    name: productData.name || "",
    sku: productData.sku || "",
    price: productData.price || 0,
    category: productData.category || "",
    threshold: productData.threshold || 0,
    box_qty: productData.box_qty || 0,
    ...productData
  };
};

// Delete a product
export const deleteProduct = async (id: string): Promise<void> => {
  // This would be replaced with an actual API call
  console.log("Deleting product:", id);
};

// Add inventory movement
export const addMovement = async (movement: Omit<Movement, "id" | "created_at">): Promise<Movement> => {
  // This would be replaced with an actual API call
  console.log("Adding movement:", movement);
  return {
    id: Math.random().toString(36).substring(2, 11),
    created_at: new Date().toISOString(),
    ...movement
  };
};

// Add inventory item
export const addInventory = async (inventory: Omit<InventoryItem, "id">): Promise<InventoryItem> => {
  // This would be replaced with an actual API call
  console.log("Adding inventory:", inventory);
  return {
    id: Math.random().toString(36).substring(2, 11),
    ...inventory
  };
};

// Update inventory item
export const updateInventory = async (id: string, inventoryData: Partial<InventoryItem>): Promise<InventoryItem> => {
  // This would be replaced with an actual API call
  console.log("Updating inventory:", id, inventoryData);
  return {
    id,
    product_id: inventoryData.product_id || "",
    warehouse_id: inventoryData.warehouse_id || "",
    quantity: inventoryData.quantity || 0,
    ...inventoryData
  };
};

// Transfer products between warehouses
export const transferProducts = async (transfer: TransferRequest): Promise<Movement> => {
  // This would be replaced with an actual API call
  console.log("Transferring products:", transfer);
  return {
    id: Math.random().toString(36).substring(2, 11),
    type: "transferencia",
    product_id: transfer.product_id,
    warehouse_id: transfer.sourceWarehouseId,
    source_warehouse_id: transfer.sourceWarehouseId,
    destination_warehouse_id: transfer.destinationWarehouseId,
    quantity: transfer.quantity,
    responsible_id: transfer.responsible_id,
    notes: transfer.notes,
    created_at: new Date().toISOString()
  };
};

// Update product stock
export const updateStock = async (productId: string, warehouseId: string, quantity: number): Promise<void> => {
  // This would be replaced with an actual API call
  console.log(`Updating stock for product ${productId} in warehouse ${warehouseId}: ${quantity}`);
};

// Export the types to make them available
export type { Product, Warehouse, Movement, TransferRequest, InventoryItem };
