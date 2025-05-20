
import { supabase } from '@/integrations/supabase/client';
import { Product, TransferRequest } from '@/types/inventory-types';

/**
 * Obtener todos los productos
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getProducts:", error);
    return [];
  }
};

/**
 * Crear un nuevo producto
 */
export const createProduct = async (product: Omit<Product, "id">): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Error in createProduct:", error);
    return null;
  }
};

/**
 * Actualizar un producto existente
 */
export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Error in updateProduct:", error);
    return null;
  }
};

/**
 * Eliminar un producto
 */
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting product:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    return false;
  }
};

/**
 * Añadir inventario a un producto
 */
export const addInventory = async (productId: string, warehouseId: string, quantity: number): Promise<boolean> => {
  try {
    // Primero obtenemos el producto actual
    const { data: product, error: getError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (getError || !product) {
      console.error("Error getting product:", getError);
      return false;
    }

    // Actualizamos el inventario según el almacén
    let updateData: any = {};
    
    if (warehouseId === 'main') {
      updateData.stock = (product.stock || 0) + quantity;
    } else {
      updateData[`stock_${warehouseId}`] = (product[`stock_${warehouseId}`] || 0) + quantity;
    }

    // Actualizamos el producto
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error("Error updating inventory:", updateError);
      return false;
    }

    // Registramos el movimiento
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: quantity,
        movement_type: 'add',
        date: new Date().toISOString()
      });

    if (movementError) {
      console.error("Error recording movement:", movementError);
    }

    return true;
  } catch (error) {
    console.error("Error in addInventory:", error);
    return false;
  }
};

/**
 * Actualizar inventario de un producto
 */
export const updateInventory = async (
  productId: string, 
  warehouseId: string, 
  newQuantity: number
): Promise<boolean> => {
  try {
    // Actualizamos el inventario según el almacén
    let updateData: any = {};
    
    if (warehouseId === 'main') {
      updateData.stock = newQuantity;
    } else {
      updateData[`stock_${warehouseId}`] = newQuantity;
    }

    // Actualizamos el producto
    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (error) {
      console.error("Error updating inventory:", error);
      return false;
    }

    // Registramos el movimiento
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: newQuantity,
        movement_type: 'update',
        date: new Date().toISOString()
      });

    if (movementError) {
      console.error("Error recording movement:", movementError);
    }

    return true;
  } catch (error) {
    console.error("Error in updateInventory:", error);
    return false;
  }
};

/**
 * Transferir inventario entre almacenes
 */
export const transferInventory = async (
  productId: string,
  sourceWarehouseId: string,
  destinationWarehouseId: string,
  quantity: number
): Promise<boolean> => {
  try {
    // Primero obtenemos el producto actual
    const { data: product, error: getError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (getError || !product) {
      console.error("Error getting product:", getError);
      return false;
    }

    // Actualizamos el inventario de origen
    let sourceQuantity = 0;
    if (sourceWarehouseId === 'main') {
      sourceQuantity = (product.stock || 0) - quantity;
    } else {
      sourceQuantity = (product[`stock_${sourceWarehouseId}`] || 0) - quantity;
    }

    // Actualizamos el inventario de destino
    let destQuantity = 0;
    if (destinationWarehouseId === 'main') {
      destQuantity = (product.stock || 0) + quantity;
    } else {
      destQuantity = (product[`stock_${destinationWarehouseId}`] || 0) + quantity;
    }

    // Validamos que haya suficiente inventario
    if (sourceQuantity < 0) {
      console.error("Insufficient inventory for transfer");
      return false;
    }

    // Preparamos los datos a actualizar
    let updateData: any = {};
    
    if (sourceWarehouseId === 'main') {
      updateData.stock = sourceQuantity;
    } else {
      updateData[`stock_${sourceWarehouseId}`] = sourceQuantity;
    }
    
    if (destinationWarehouseId === 'main') {
      updateData.stock = destQuantity;
    } else {
      updateData[`stock_${destinationWarehouseId}`] = destQuantity;
    }

    // Actualizamos el producto
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error("Error updating inventory during transfer:", updateError);
      return false;
    }

    // Registramos el movimiento
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: productId,
        warehouse_id: sourceWarehouseId,
        destination_warehouse_id: destinationWarehouseId,
        quantity: quantity,
        movement_type: 'transfer',
        date: new Date().toISOString()
      });

    if (movementError) {
      console.error("Error recording movement:", movementError);
    }

    return true;
  } catch (error) {
    console.error("Error in transferInventory:", error);
    return false;
  }
};

/**
 * Obtener movimientos de inventario
 */
export const getInventoryMovements = async (productId?: string): Promise<any[]> => {
  try {
    let query = supabase
      .from('inventory_movements')
      .select('*, product:products(name)');
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error("Error fetching inventory movements:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getInventoryMovements:", error);
    return [];
  }
};

// Re-exportamos los tipos para que sean accesibles
export { Product, TransferRequest } from '@/types/inventory-types';
export { useInventoryService } from '@/hooks/useInventoryService';
