import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, Filter, FileDown, ShoppingCart } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Customer, 
  Order, 
  OrderItem, 
  getCustomers, 
  getOrders, 
  useOrderService 
} from '@/services/order.service';
import { useInventoryService } from '@/services/inventory.service';
import { useAuth } from '@/hooks/useAuth';

type Customer = User;

const Orders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const orderService = useOrderService();
  const inventoryService = useInventoryService();
  
  // Estado para los datos
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<{ id: number, name: string, price: number, stock: number, warehouse1: number, warehouse2: number, warehouse3: number, mainWarehouse: number }[]>([]);
  
  // New order state
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load customers and convert to the expected format
        const customersData = await orderService.loadCustomers();
        setCustomers(orderService.customers);
        
        // Load orders
        const ordersData = await orderService.loadOrders();
        setOrders(ordersData);
        
        // Load products
        const productsData = inventoryService.getInventory().map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.mainWarehouse + p.warehouse1 + p.warehouse2 + p.warehouse3,
          warehouse1: p.warehouse1,
          warehouse2: p.warehouse2,
          warehouse3: p.warehouse3,
          mainWarehouse: p.mainWarehouse
        }));
        
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Error al cargar los datos",
          variant: "destructive"
        });
      }
    };
    
    loadData();
  }, [orderService, inventoryService, toast]);

  // Filtrar pedidos según el rol del usuario y los filtros aplicados
  const filteredOrders = orders.filter(order => {
    // Filtro de búsqueda
    const matchesSearch = searchQuery === '' || 
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtro de estado
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Filtros según rol
    if (user?.role === 'cliente') {
      // Cliente solo ve sus propios pedidos
      return matchesSearch && matchesStatus && order.customer === user.name;
    } else if (user?.role === 'bodeguero') {
      // Bodeguero solo ve pedidos en preparación
      return matchesSearch && (statusFilter === 'all' ? 
        (order.status === 'preparacion') : 
        (order.status === statusFilter && order.status === 'preparacion'));
    } else if (user?.role === 'domiciliario') {
      // Domiciliario solo ve pedidos asignados a él
      return matchesSearch && matchesStatus && order.deliveryPersonName === user.name;
    } else {
      // Admin y oficinista ven todos los pedidos
      return matchesSearch && matchesStatus;
    }
  });
  
  const addProductToOrder = (productId: number) => {
    const product = products.find(p => p.id === parseInt(productId.toString()));
    
    if (product) {
      setNewOrderItems([
        ...newOrderItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price
        }
      ]);
    }
  };

  const removeProductFromOrder = (index: number) => {
    const updatedItems = [...newOrderItems];
    updatedItems.splice(index, 1);
    setNewOrderItems(updatedItems);
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...newOrderItems];
    updatedItems[index].quantity = quantity;
    setNewOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return newOrderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = () => {
    if (!selectedWarehouse) {
      toast({
        title: "Error",
        description: "Por favor seleccione una bodega de origen",
        variant: "destructive"
      });
      return;
    }

    if (user?.role === 'cliente') {
      // Si es cliente, usar sus datos automáticamente
      const clientCustomerId = user.id;
      
      if (!clientCustomerId) {
        toast({
          title: "Error",
          description: "No se encontraron tus datos de cliente",
          variant: "destructive"
        });
        return;
      }
      
      if (newOrderItems.length === 0) {
        toast({
          title: "Error",
          description: "Por favor añade al menos un producto",
          variant: "destructive"
        });
        return;
      }
      
      try {
        // Crear el pedido con la bodega seleccionada
        const newOrder = orderService.createOrder({
          customerId: clientCustomerId,
          items: newOrderItems,
          warehouseSource: selectedWarehouse
        });
        
        // Actualizar la lista de pedidos
        setOrders([newOrder, ...orders]);
        
        // Reset form
        setNewOrderItems([]);
        setSelectedWarehouse('');
        setIsNewOrderDialogOpen(false);
        
        toast({
          title: "Pedido creado",
          description: "Tu pedido ha sido creado exitosamente"
        });
      } catch (error: any) {
        console.error(error);
      }
    } else {
      // Para admin y oficinista
      if (!selectedCustomer || newOrderItems.length === 0) {
        toast({
          title: "Error",
          description: "Por favor seleccione un cliente y añada al menos un producto",
          variant: "destructive"
        });
        return;
      }

      try {
        // Crear el pedido con la bodega seleccionada
        const newOrder = orderService.createOrder({
          customerId: parseInt(selectedCustomer),
          items: newOrderItems,
          warehouseSource: selectedWarehouse
        });
        
        // Actualizar la lista de pedidos
        setOrders([newOrder, ...orders]);
        
        // Reset form
        setSelectedCustomer('');
        setNewOrderItems([]);
        setSelectedWarehouse('');
        setIsNewOrderDialogOpen(false);
      } catch (error: any) {
        console.error(error);
      }
    }
  };

  const viewOrder = (order: Order) => {
    setCurrentOrder(order);
    setIsViewOrderDialogOpen(true);
  };

  const updateOrderStatus = (status: Order['status'], deliveryPersonId?: number, deliveryPersonName?: string) => {
    if (currentOrder) {
      try {
        // Verificar permiso según rol
        if (user?.role === 'bodeguero' && status !== 'enviado' && currentOrder.status !== 'preparacion') {
          toast({
            title: "Permiso denegado",
            description: "Solo puedes cambiar pedidos en preparación a estado enviado",
            variant: "destructive"
          });
          return;
        }
        
        if (user?.role === 'domiciliario' && status !== 'entregado' && currentOrder.status !== 'enviado') {
          toast({
            title: "Permiso denegado",
            description: "Solo puedes cambiar pedidos enviados a estado entregado",
            variant: "destructive"
          });
          return;
        }
        
        // Actualizar el estado del pedido
        const updatedOrder = orderService.updateOrderStatus(
          currentOrder.id, 
          status,
          deliveryPersonId,
          deliveryPersonName
        );
        
        // Actualizar la lista de pedidos
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setIsViewOrderDialogOpen(false);
      } catch (error: any) {
        console.error(error);
      }
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Pendiente</Badge>;
      case 'preparacion':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">En Preparación</Badge>;
      case 'enviado':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Enviado</Badge>;
      case 'entregado':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Entregado</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtrar productos disponibles según la bodega seleccionada
  const getAvailableProducts = () => {
    if (!selectedWarehouse) return products.filter(p => p.stock > 0);
    
    switch (selectedWarehouse) {
      case 'warehouse1':
        return products.filter(p => p.warehouse1 > 0);
      case 'warehouse2':
        return products.filter(p => p.warehouse2 > 0);
      case 'warehouse3':
        return products.filter(p => p.warehouse3 > 0);
      case 'mainWarehouse':
        return products.filter(p => p.mainWarehouse > 0);
      default:
        return products.filter(p => p.stock > 0);
    }
  };

  // Vista específica para cliente
  if (user?.role === 'cliente') {
    // Filtrar productos disponibles (con stock > 0)
    const availableProducts = getAvailableProducts();
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Pedidos</h1>
          <p className="text-muted-foreground">
            Realiza nuevos pedidos y visualiza tu historial.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Card className="sm:w-1/3 lg:w-1/4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total de Pedidos</span>
                  <span className="font-medium">{filteredOrders.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">En Proceso</span>
                  <span className="font-medium">{filteredOrders.filter(o => o.status === 'pendiente' || o.status === 'preparacion').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Entregados</span>
                  <span className="font-medium">{filteredOrders.filter(o => o.status === 'entregado').length}</span>
                </div>
                
                <div className="pt-4">
                  <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Pedido
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Pedido</DialogTitle>
                        <DialogDescription>
                          Selecciona los productos que deseas ordenar
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Seleccionar Bodega</Label>
                          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar Bodega" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mainWarehouse">Bodega Principal</SelectItem>
                              <SelectItem value="warehouse1">Bodega 1</SelectItem>
                              <SelectItem value="warehouse2">Bodega 2</SelectItem>
                              <SelectItem value="warehouse3">Bodega 3</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <div className="flex justify-between items-center mt-4">
                            <Label>Productos Disponibles</Label>
                            <Select 
                              onValueChange={(value) => addProductToOrder(parseInt(value))}
                              disabled={!selectedWarehouse}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Añadir Producto" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableProducts.map(product => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - ${product.price.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {newOrderItems.length > 0 ? (
                            <div className="border rounded-md mt-2">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Subtotal</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {newOrderItems.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{item.productName}</TableCell>
                                      <TableCell>${item.price.toFixed(2)}</TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={item.quantity}
                                          onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                                          className="w-20"
                                        />
                                      </TableCell>
                                      <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeProductFromOrder(index)}
                                        >
                                          Eliminar
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                                    <TableCell className="font-medium">${calculateTotal().toFixed(2)}</TableCell>
                                    <TableCell></TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="border rounded-md p-6 text-center text-muted-foreground">
                              No hay productos en el pedido. Añada productos usando el selector.
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewOrderDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateOrder}>Crear Pedido</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="sm:w-2/3 lg:w-3/4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Historial de Pedidos</CardTitle>
                  <CardDescription>
                    Todos tus pedidos ordenados por fecha
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar pedido..."
                      className="pl-8 w-[180px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Estado" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="preparacion">En Preparación</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Nº Pedido</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                          <TableCell>{order.items?.length || 0} productos</TableCell>
                          <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => viewOrder(order)}
                              >
                                Ver Detalles
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No has realizado ningún pedido aún.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Order Dialog */}
        <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
          <DialogContent className="max-w-2xl">
            {currentOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Detalles del Pedido #{currentOrder.orderNumber}
                  </DialogTitle>
                  <DialogDescription>
                    Fecha: {new Date(currentOrder.date).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Cliente</h3>
                      <p className="text-sm">{currentOrder.customer}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Estado</h3>
                      <div>{getStatusBadge(currentOrder.status)}</div>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium mb-1">Dirección de Entrega</h3>
                      <p className="text-sm">{currentOrder.address}</p>
                    </div>
                    {currentOrder.deliveryPersonName && (
                      <div className="col-span-2">
                        <h3 className="text-sm font-medium mb-1">Repartidor</h3>
                        <p className="text-sm">{currentOrder.deliveryPersonName}</p>
                      </div>
                    )}
                    {currentOrder.warehouseSource && (
                      <div className="col-span-2">
                        <h3 className="text-sm font-medium mb-1">Bodega de Origen</h3>
                        <p className="text-sm">
                          {currentOrder.warehouseSource === 'mainWarehouse' && 'Bodega Principal'}
                          {currentOrder.warehouseSource === 'warehouse1' && 'Bodega 1'}
                          {currentOrder.warehouseSource === 'warehouse2' && 'Bodega 2'}
                          {currentOrder.warehouseSource === 'warehouse3' && 'Bodega 3'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Productos</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentOrder.items?.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                            <TableCell className="text-right font-medium">${currentOrder.total.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsViewOrderDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Vista para el bodeguero
  if (user?.role === 'bodeguero') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pedidos en Preparación</h1>
          <p className="text-muted-foreground">
            Gestión de pedidos en proceso de preparación.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Pedidos Asignados</CardTitle>
                <CardDescription>
                  Pedidos que requieren ser preparados y enviados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar pedido..."
                    className="pl-8 md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
              
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Nº Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                        <TableCell>{order.items?.length || 0} productos</TableCell>
                        <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => viewOrder(order)}
                            >
                              Ver Detalles
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No hay pedidos en preparación actualmente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Order Dialog for Bodeguero */}
        <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
          <DialogContent className="max-w-2xl">
            {currentOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Detalles del Pedido #{currentOrder.orderNumber}
                  </DialogTitle>
                  <DialogDescription>
                    Fecha: {new Date(currentOrder.date).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Cliente</h3>
                      <p className="text-sm">{currentOrder.customer}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Estado</h3>
                      <div>{getStatusBadge(currentOrder.status)}</div>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium mb-1">Dirección de Entrega</h3>
                      <p className="text-sm">{currentOrder.address}</p>
                    </div>
                    {currentOrder.warehouseSource && (
                      <div className="col-span-2">
                        <h3 className="text-sm font-medium mb-1">Bodega de Origen</h3>
                        <p className="text-sm">
                          {currentOrder.warehouseSource === 'mainWarehouse' && 'Bodega Principal'}
                          {currentOrder.warehouseSource === 'warehouse1' && 'Bodega 1'}
                          {currentOrder.warehouseSource === 'warehouse2' && 'Bodega 2'}
                          {currentOrder.warehouseSource === 'warehouse3' && 'Bodega 3'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Productos</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentOrder.items?.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                            <TableCell className="text-right font-medium">${currentOrder.total.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Seleccionar domiciliario para envío */}
                  {currentOrder.status === 'preparacion' && (
                    <div className="mt-4">
                      <Label htmlFor="deliveryPerson">Asignar Domiciliario</Label>
                      <Select defaultValue="1">
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Seleccionar Domiciliario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Luis Torres</SelectItem>
                          <SelectItem value="2">María Gómez</SelectItem>
                          <SelectItem value="3">Carlos Rodríguez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  {currentOrder.status === 'preparacion' && (
                    <Button 
                      variant="outline" 
                      className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
                      onClick={() => updateOrderStatus('enviado', 1, 'Luis Torres')}
                    >
                      Marcar como Enviado
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => setIsViewOrderDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista para domiciliario
  if (user?.role === 'domiciliario') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Entregas</h1>
          <p className="text-muted-foreground">
            Entregas asignadas y su estado.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Pedidos Asignados</CardTitle>
                <CardDescription>
                  Pedidos que necesitan ser entregados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar pedido..."
                    className="pl-8 md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="md:w-[180px]">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Estado" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="enviado">Por Entregar</SelectItem>
                    <SelectItem value="entregado">Entregados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
              
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Nº Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{order.address}</TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => viewOrder(order)}
                            >
                              Ver Detalles
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No hay pedidos asignados actualmente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Order Dialog for Domiciliario */}
        <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
          <DialogContent className="max-w-2xl">
            {currentOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Detalles del Pedido #{currentOrder.orderNumber}
                  </DialogTitle>
                  <DialogDescription>
                    Fecha: {new Date(currentOrder.date).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Cliente</h3>
                      <p className="text-sm">{currentOrder.customer}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Estado</h3>
                      <div>{getStatusBadge(currentOrder.status)}</div>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium mb-1">Dirección de Entrega</h3>
                      <p className="text-sm">{currentOrder.address}</p>
                    </div>
                    {currentOrder.warehouseSource && (
                      <div className="col-span-2">
                        <h3 className="text-sm font-medium mb-1">Bodega de Origen</h3>
                        <p className="text-sm">
                          {currentOrder.warehouseSource === 'mainWarehouse' && 'Bodega Principal'}
                          {currentOrder.warehouseSource === 'warehouse1' && 'Bodega 1'}
                          {currentOrder.warehouseSource === 'warehouse2' && 'Bodega 2'}
                          {currentOrder.warehouseSource === 'warehouse3' && 'Bodega 3'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Productos</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentOrder.items?.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  {currentOrder.status === 'enviado' && (
                    <Button 
                      variant="outline" 
                      className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                      onClick={() => updateOrderStatus('entregado')}
                    >
                      Marcar como Entregado
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => setIsViewOrderDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista para admin y oficinista (default)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pedidos</h1>
        <p className="text-muted-foreground">
          Gestión de pedidos de clientes y seguimiento de estado.
        </p>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <Card className="md:w-1/3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pedidos Recientes</CardTitle>
            <CardDescription>Última actualización: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pendientes</span>
                <span className="font-medium">{orders.filter(o => o.status === 'pendiente').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">En preparación</span>
                <span className="font-medium">{orders.filter(o => o.status === 'preparacion').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Enviados</span>
                <span className="font-medium">{orders.filter(o => o.status === 'enviado').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Entregados</span>
                <span className="font-medium">{orders.filter(o => o.status === 'entregado').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:w-2/3 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Resumen de Ventas</CardTitle>
              <Button variant="outline" size="sm" className="h-8">
                <FileDown className="h-4 w-4 mr-1" /> Exportar
              </Button>
            </div>
            <CardDescription>Periodo: Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-bold">
                  ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold">
                  ${orders.length > 0 ? (orders.reduce((sum, order) => sum + order.total, 0) / orders.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Gestión de Pedidos</CardTitle>
              <CardDescription>
                Administra y da seguimiento a los pedidos de tus clientes
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Pedido
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Pedido</DialogTitle>
                    <DialogDescription>
                      Complete los detalles para crear un nuevo pedido
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="customer">Cliente</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar Cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCustomer && (
                        <p className="text-sm text-muted-foreground">
                          {customers.find(c => c.id === parseInt(selectedCustomer))?.address}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>Seleccionar Bodega</Label>
                      <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar Bodega" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mainWarehouse">Bodega Principal</SelectItem>
                          <SelectItem value="warehouse1">Bodega 1</SelectItem>
                          <SelectItem value="warehouse2">Bodega 2</SelectItem>
                          <SelectItem value="warehouse3">Bodega 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <Label>Productos</Label>
                        <Select 
                          onValueChange={(value) => addProductToOrder(parseInt(value))}
                          disabled={!selectedWarehouse || !selectedCustomer}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Añadir Producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableProducts().map(product => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - ${product.price.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {newOrderItems.length > 0 ? (
                        <div className="border rounded-md mt-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Subtotal</TableHead>
                                <TableHead className="w-[70px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {newOrderItems.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.productName}</TableCell>
                                  <TableCell>${item.price.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                                      className="w-20"
                                    />
                                  </TableCell>
                                  <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeProductFromOrder(index)}
                                    >
                                      Eliminar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                                <TableCell className="font-medium">${calculateTotal().toFixed(2)}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="border rounded-md p-6 text-center text-muted-foreground">
                          No hay productos en el pedido. Añada productos usando el selector.
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewOrderDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateOrder}>Crear Pedido</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar pedido..."
                  className="pl-8 md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Estado" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="preparacion">En Preparación</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
            
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Nº Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                      <TableCell>{order.items?.length || 0} productos</TableCell>
                      <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => viewOrder(order)}
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No se encontraron pedidos que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          {currentOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Detalles del Pedido #{currentOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  Fecha: {new Date(currentOrder.date).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Cliente</h3>
                    <p className="text-sm">{currentOrder.customer}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Estado</h3>
                    <div>{getStatusBadge(currentOrder.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium mb-1">Dirección de Entrega</h3>
                    <p className="text-sm">{currentOrder.address}</p>
                  </div>
                  {currentOrder.deliveryPersonName && (
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium mb-1">Repartidor</h3>
                      <p className="text-sm">{currentOrder.deliveryPersonName}</p>
                    </div>
                  )}
                  {currentOrder.warehouseSource && (
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium mb-1">Bodega de Origen</h3>
                      <p className="text-sm">
                        {currentOrder.warehouseSource === 'mainWarehouse' && 'Bodega Principal'}
                        {currentOrder.warehouseSource === 'warehouse1' && 'Bodega 1'}
                        {currentOrder.warehouseSource === 'warehouse2' && 'Bodega 2'}
                        {currentOrder.warehouseSource === 'warehouse3' && 'Bodega 3'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Productos</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentOrder.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                          <TableCell className="text-right font-medium">${currentOrder.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {currentOrder.status === 'pendiente' && (
                  <Button 
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                    onClick={() => updateOrderStatus('preparacion')}
                  >
                    Pasar a Preparación
                  </Button>
                )}
                {currentOrder.status === 'preparacion' && (
                  <Button 
                    variant="outline" 
                    className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
                    onClick={() => updateOrderStatus('enviado', 1, 'Luis Torres')}
                  >
                    Marcar como Enviado
                  </Button>
                )}
                {currentOrder.status === 'enviado' && (
                  <Button 
                    variant="outline" 
                    className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                    onClick={() => updateOrderStatus('entregado')}
                  >
                    Marcar como Entregado
                  </Button>
                )}
                {currentOrder.status !== 'entregado' && currentOrder.status !== 'cancelado' && (
                  <Button 
                    variant="outline" 
                    className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                    onClick={() => updateOrderStatus('cancelado')}
                  >
                    Cancelar Pedido
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setIsViewOrderDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
