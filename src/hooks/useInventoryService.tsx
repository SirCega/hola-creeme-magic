
import { useState } from 'react';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  addInventory, 
  updateInventory, 
  transferInventory, 
  getInventoryMovements 
} from '@/services/inventory.service';
import type { Product, TransferRequest, InventoryMovement, Warehouse } from '@/types/inventory-types';
import { useToast } from './use-toast';

export function useInventoryService() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    { id: 'main', name: 'Principal', type: 'main', address: 'Sede Central', capacity: 1000, status: 'active' },
    { id: '1', name: 'Almacén 1', type: 'secondary', address: 'Sede Norte', capacity: 500, status: 'active' },
    { id: '2', name: 'Almacén 2', type: 'secondary', address: 'Sede Sur', capacity: 500, status: 'active' },
    { id: '3', name: 'Almacén 3', type: 'secondary', address: 'Sede Este', capacity: 300, status: 'active' },
  ]);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Error cargando productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async (productId?: string) => {
    try {
      setLoading(true);
      const data = await getInventoryMovements(productId);
      setMovements(data);
      setError(null);
    } catch (err) {
      setError('Error cargando movimientos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (product: Omit<Product, "id">) => {
    try {
      setLoading(true);
      const newProduct = await createProduct(product);
      if (newProduct) {
        toast({
          title: "Éxito",
          description: "Producto creado correctamente",
        });
        await loadProducts();
        return true;
      }
      return false;
    } catch (err) {
      setError('Error creando producto');
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id: string, product: Partial<Product>) => {
    try {
      setLoading(true);
      const updatedProduct = await updateProduct(id, product);
      if (updatedProduct) {
        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente",
        });
        await loadProducts();
        return true;
      }
      return false;
    } catch (err) {
      setError('Error actualizando producto');
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      setLoading(true);
      const success = await deleteProduct(id);
      if (success) {
        toast({
          title: "Éxito",
          description: "Producto eliminado correctamente",
        });
        await loadProducts();
        return true;
      }
      return false;
    } catch (err) {
      setError('Error eliminando producto');
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventory = async (productId: string, warehouseId: string, quantity: number) => {
    try {
      setLoading(true);
      const success = await addInventory(productId, warehouseId, quantity);
      if (success) {
        toast({
          title: "Éxito",
          description: "Inventario actualizado correctamente",
        });
        await loadProducts();
        return true;
      }
      return false;
    } catch (err) {
      setError('Error añadiendo inventario');
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo añadir al inventario",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (productId: string, warehouseId: string, quantity: number) => {
    try {
      setLoading(true);
      const success = await updateInventory(productId, warehouseId, quantity);
      if (success) {
        toast({
          title: "Éxito",
          description: "Inventario actualizado correctamente",
        });
        await loadProducts();
        return true;
      }
      return false;
    } catch (err) {
      setError('Error actualizando inventario');
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleTransferInventory = async (
    productId: string,
    sourceWarehouseId: string,
    destinationWarehouseId: string,
    quantity: number
  ) => {
    try {
      setLoading(true);
      const success = await transferInventory(
        productId,
        sourceWarehouseId,
        destinationWarehouseId,
        quantity
      );
      
      if (success) {
        toast({
          title: "Éxito",
          description: "Transferencia realizada correctamente",
        });
        await loadProducts();
        return true;
      }
      return false;
    } catch (err) {
      setError('Error en la transferencia');
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo realizar la transferencia",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Additional methods needed by MovementHistory.tsx
  const addMovement = async (movement: any) => {
    try {
      setLoading(true);
      // This is a placeholder - in a real app, this would call a backend service
      console.log("Adding movement:", movement);
      
      // Handle different movement types
      if (movement.type === 'entrada') {
        await handleAddInventory(movement.product_id, movement.warehouse_id, movement.quantity);
      } else if (movement.type === 'salida') {
        await handleAddInventory(movement.product_id, movement.warehouse_id, -movement.quantity);
      } else if (movement.type === 'transferencia' && movement.destination_warehouse_id) {
        await handleTransferInventory(
          movement.product_id,
          movement.warehouse_id,
          movement.destination_warehouse_id,
          movement.quantity
        );
      }
      
      toast({
        title: "Éxito",
        description: "Movimiento registrado correctamente",
      });
      
      await loadMovements();
      return true;
    } catch (err) {
      setError('Error registrando movimiento');
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Alias functions for compatibility
  const getInventory = loadProducts;
  const transferProduct = handleTransferInventory;
  const addProduct = handleCreateProduct;

  return {
    products,
    warehouses,
    loading,
    error,
    movements,
    loadProducts,
    loadMovements,
    createProduct: handleCreateProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    addInventory: handleAddInventory,
    updateInventory: handleUpdateInventory,
    transferInventory: handleTransferInventory,
    addMovement,
    getInventory,
    transferProduct,
    addProduct
  };
}

export type { Product, TransferRequest, InventoryMovement, Warehouse };
