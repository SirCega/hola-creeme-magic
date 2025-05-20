import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Truck, PackageCheck } from 'lucide-react';
import { Product, TransferRequest } from '@/types/inventory-types';
import { useInventoryService } from '@/hooks/useInventoryService';
import MovementHistory from '@/components/inventory/MovementHistory';

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    products, 
    warehouses,
    loading, 
    error, 
    loadProducts, 
    createProduct, 
    updateProduct,
    transferInventory 
  } = useInventoryService();

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    category: '',
    price: 0,
    sku: '',
    box_qty: 0,
    threshold: 0,
    min_stock: 0,
    stock: 0,
    brand: '',
    cost: 0,
    unit: '',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [transferRequest, setTransferRequest] = useState<TransferRequest>({
    productId: '',
    quantity: 0,
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const lowStockProducts = products.filter(product => {
    // Check if any warehouse is below min_stock
    const isLowStock = (product.stock || 0) < (product.min_stock || 0) ||
      (product.stock_1 || 0) < (product.min_stock || 0) ||
      (product.stock_2 || 0) < (product.min_stock || 0) ||
      (product.stock_3 || 0) < (product.min_stock || 0);
    
    return isLowStock;
  });

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferRequest.productId || !transferRequest.sourceWarehouseId || !transferRequest.destinationWarehouseId || transferRequest.quantity <= 0) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos correctamente",
        variant: "destructive"
      });
      return;
    }
    
    if (transferRequest.sourceWarehouseId === transferRequest.destinationWarehouseId) {
      toast({
        title: "Error",
        description: "El almacén de origen y destino no pueden ser el mismo",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const success = await transferInventory(
        transferRequest.productId,
        transferRequest.sourceWarehouseId,
        transferRequest.destinationWarehouseId,
        transferRequest.quantity
      );
      
      if (success) {
        // Reset form
        setTransferRequest({
          productId: '',
          quantity: 0,
          sourceWarehouseId: '',
          destinationWarehouseId: '',
          notes: ''
        });
        
        await loadProducts();
        
        toast({
          title: "Transferencia exitosa",
          description: "El producto ha sido transferido correctamente."
        });
      }
    } catch (error) {
      console.error("Error al transferir producto:", error);
      toast({
        title: "Error",
        description: "No se pudo transferir el producto",
        variant: "destructive"
      });
    }
  };

  const getWarehouseStock = (product: Product, warehouseId: string) => {
    if (warehouseId === 'main') return product.stock || 0;
    if (warehouseId === '1') return product.stock_1 || 0;
    if (warehouseId === '2') return product.stock_2 || 0;
    if (warehouseId === '3') return product.stock_3 || 0;
    return 0;
  };

  const renderStockStatus = (stock: number, minStock: number = 0) => {
    if (stock <= 0) {
      return <span className="text-red-500 font-bold">Sin Stock</span>;
    } else if (stock < minStock) {
      return <span className="text-yellow-500 font-bold">Bajo Stock</span>;
    } else {
      return <span className="text-green-500">OK</span>;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Control de Inventario</h1>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Producto</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Complete los detalles del nuevo producto
                </DialogDescription>
              </DialogHeader>
              {/* Formulario para nuevo producto */}
              <form onSubmit={(e) => {
                e.preventDefault();
                createProduct(newProduct);
              }}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="category">Categoría</Label>
                      <Input
                        id="category"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">Marca</Label>
                      <Input
                        id="brand"
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="cost">Costo</Label>
                      <Input
                        id="cost"
                        type="number"
                        value={newProduct.cost}
                        onChange={(e) => setNewProduct({...newProduct, cost: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Precio</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unidad</Label>
                      <Input
                        id="unit"
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="box_qty">Cantidad por caja</Label>
                      <Input
                        id="box_qty"
                        type="number"
                        value={newProduct.box_qty}
                        onChange={(e) => setNewProduct({...newProduct, box_qty: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_stock">Stock mínimo</Label>
                      <Input
                        id="min_stock"
                        type="number"
                        value={newProduct.min_stock}
                        onChange={(e) => setNewProduct({...newProduct, min_stock: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock inicial</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <Button type="submit">Guardar Producto</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline"><Truck className="mr-2 h-4 w-4" /> Transferencia</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Transferir Inventario</SheetTitle>
                <SheetDescription>
                  Mueva productos entre almacenes
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="product">Producto</Label>
                    <Select 
                      value={transferRequest.productId} 
                      onValueChange={(value) => setTransferRequest({...transferRequest, productId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sourceWarehouse">Origen</Label>
                    <Select 
                      value={transferRequest.sourceWarehouseId} 
                      onValueChange={(value) => setTransferRequest({...transferRequest, sourceWarehouseId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar almacén origen" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="destinationWarehouse">Destino</Label>
                    <Select 
                      value={transferRequest.destinationWarehouseId} 
                      onValueChange={(value) => setTransferRequest({...transferRequest, destinationWarehouseId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar almacén destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={transferRequest.quantity || ''}
                      onChange={(e) => setTransferRequest({...transferRequest, quantity: parseInt(e.target.value || '0')})}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Input
                      id="notes"
                      value={transferRequest.notes || ''}
                      onChange={(e) => setTransferRequest({...transferRequest, notes: e.target.value})}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">Transferir</Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="mb-6 border-yellow-500">
          <CardHeader className="bg-yellow-50">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <CardTitle className="text-yellow-800">Productos con bajo stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Bodega Principal</TableHead>
                    <TableHead className="text-center">Almacenes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        {product.stock || 0} / {product.min_stock || 0}
                        {renderStockStatus(product.stock || 0, product.min_stock || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-around">
                          <div>
                            <span className="text-xs">A1:</span> {product.stock_1 || 0}
                          </div>
                          <div>
                            <span className="text-xs">A2:</span> {product.stock_2 || 0}
                          </div>
                          <div>
                            <span className="text-xs">A3:</span> {product.stock_3 || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <PackageCheck className="mr-1 h-4 w-4" /> Reabastecer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          {loading ? (
            <div className="flex justify-center p-4">Cargando inventario...</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-center">Bodega Principal</TableHead>
                      <TableHead className="text-center">Almacén 1</TableHead>
                      <TableHead className="text-center">Almacén 2</TableHead>
                      <TableHead className="text-center">Almacén 3</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-center">{product.stock || 0}</TableCell>
                        <TableCell className="text-center">{product.stock_1 || 0}</TableCell>
                        <TableCell className="text-center">{product.stock_2 || 0}</TableCell>
                        <TableCell className="text-center">{product.stock_3 || 0}</TableCell>
                        <TableCell className="text-right">${product.price?.toFixed(2) || '0.00'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="movements">
          <MovementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;
