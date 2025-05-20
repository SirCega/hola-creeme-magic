import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Badge
} from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/auth-types';
import { 
  useOrderService, Order, OrderItem, Customer 
} from '@/services/order.service';

// Orders page component
const Orders = () => {
  // State for orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState<boolean>(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('1');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Get order service
  const orderService = useOrderService();

  // Load orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await orderService.loadOrders();
        setOrders(data);
        setCustomers(await orderService.loadCustomers());
      } catch (error) {
        console.error('Error loading orders:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las órdenes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter((order) => {
    // Filter by search query
    const customerName = typeof order.customer === 'string' 
      ? order.customer 
      : order.customer?.name || '';
    
    const searchMatch = 
      (customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

    // Filter by status
    let statusMatch = true;
    if (statusFilter !== 'todos') {
      statusMatch = order.status.toLowerCase() === statusFilter.toLowerCase();
    }

    return searchMatch && statusMatch;
  });

  // Add a new order item
  const addOrderItem = () => {
    // In a real app, you would select this from your products list
    const newItem: OrderItem = {
      product_id: "123",
      productName: "Producto de ejemplo",
      quantity: 1,
      price: 100
    };
    setOrderItems([...orderItems, newItem]);
  };

  // Remove an order item
  const removeOrderItem = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  // Calculate order total
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Handle creating a new order
  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Por favor, seleccione un cliente",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "La orden debe tener al menos un producto",
        variant: "destructive",
      });
      return;
    }

    const shippingAddress = selectedCustomer.address || "Dirección no especificada";
    const totalAmount = calculateTotal();

    try {
      await orderService.createOrder(
        selectedCustomer.id,
        orderItems,
        shippingAddress,
        totalAmount
      );

      toast({
        title: "Éxito",
        description: "Orden creada correctamente",
      });

      // Reset form and close dialog
      setOrderItems([]);
      setSelectedCustomer(null);
      setSelectedWarehouse('1');
      setIsNewOrderDialogOpen(false);

      // Refresh orders list
      const updatedOrders = await orderService.loadOrders();
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden",
        variant: "destructive",
      });
    }
  };

  // View order details
  const viewOrderDetails = (order: Order) => {
    setCurrentOrder(order);
    setIsViewOrderDialogOpen(true);
  };

  // Handle updating order status
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      if (currentOrder && currentOrder.deliveryPersonName) {
        await orderService.updateOrderStatus(
          orderId, 
          newStatus, 
          currentOrder.deliveryPersonId, 
          currentOrder.deliveryPersonName
        );
      } else {
        await orderService.updateOrderStatus(orderId, newStatus);
      }

      toast({
        title: "Éxito",
        description: `Estado actualizado a ${newStatus}`,
      });

      // Refresh orders list and close dialog if open
      const updatedOrders = await orderService.loadOrders();
      setOrders(updatedOrders);
      
      // Update current order if dialog is open
      if (currentOrder && currentOrder.id === orderId) {
        const updatedOrder = updatedOrders.find(o => o.id === orderId);
        if (updatedOrder) {
          setCurrentOrder(updatedOrder);
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  // Handle closing view order dialog
  const handleCloseViewOrderDialog = () => {
    setIsViewOrderDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Órdenes</CardTitle>
          <CardDescription>Gestiona todas las órdenes de compra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2 w-1/2">
              <Input
                placeholder="Buscar órdenes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en proceso">En Proceso</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsNewOrderDialogOpen(true)}>Nueva Orden</Button>
          </div>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Nº Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Cargando órdenes...</TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No se encontraron órdenes</TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>{typeof order.customer === 'string' ? order.customer : order.customer?.name}</TableCell>
                      <TableCell>{new Date(order.date || order.created_at || '').toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'entregado' ? 'default' : 
                               order.status === 'cancelado' ? 'destructive' :
                               order.status === 'pendiente' ? 'secondary' :
                               order.status === 'enviado' ? 'outline' : 'default'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${order.total?.toFixed(2) || order.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Acciones
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'en proceso')}>
                              Marcar en proceso
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'enviado')}>
                              Marcar como enviado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregado')}>
                              Marcar como entregado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelado')}>
                              Cancelar orden
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {currentOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Detalles de Orden {currentOrder.orderNumber}</DialogTitle>
                <DialogDescription>
                  Cliente: {typeof currentOrder.customer === 'string' ? currentOrder.customer : currentOrder.customer?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">ID de Orden:</p>
                    <p className="text-sm">{currentOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fecha:</p>
                    <p className="text-sm">{new Date(currentOrder.date || currentOrder.created_at || '').toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cliente:</p>
                    <p className="text-sm">{typeof currentOrder.customer === 'string' ? currentOrder.customer : currentOrder.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">ID de Cliente:</p>
                    <p className="text-sm">{currentOrder.customer_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dirección de envío:</p>
                    <p className="text-sm">{currentOrder.address || currentOrder.shipping_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estado:</p>
                    <p className="text-sm">{currentOrder.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Repartidor:</p>
                    <p className="text-sm">{currentOrder.deliveryPersonName || "No asignado"}</p>
                  </div>
                </div>
                
                {currentOrder.items && currentOrder.items.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Productos:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName || `Producto ${item.product_id}`}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="text-right mt-4">
                      <p className="text-sm font-medium">Total: ${currentOrder.total?.toFixed(2) || currentOrder.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {currentOrder.status !== 'entregado' && currentOrder.status !== 'cancelado' && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Actualizar estado:</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => handleUpdateStatus(currentOrder.id, 'pendiente')}>
                        Pendiente
                      </Button>
                      <Button variant="outline" onClick={() => handleUpdateStatus(currentOrder.id, 'en proceso')}>
                        En Proceso
                      </Button>
                      <Button variant="outline" onClick={() => handleUpdateStatus(currentOrder.id, 'enviado')}>
                        Enviado
                      </Button>
                      <Button variant="outline" onClick={() => handleUpdateStatus(currentOrder.id, 'entregado')}>
                        Entregado
                      </Button>
                      <Button variant="destructive" onClick={() => handleUpdateStatus(currentOrder.id, 'cancelado')}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewOrderDialogOpen(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Nueva Orden</DialogTitle>
            <DialogDescription>Crea una nueva orden de compra</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-sm font-medium">Cliente</label>
                <Select
                  value={selectedCustomer?.id}
                  onValueChange={(value) => {
                    const customer = customers.find(c => c.id === value);
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Dirección</label>
                <Input 
                  value={selectedCustomer?.address || ''} 
                  disabled 
                  placeholder="La dirección se cargará automáticamente"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Productos</label>
                <Button size="sm" onClick={addOrderItem}>Agregar Producto</Button>
              </div>
              {orderItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName || `Producto ${item.product_id}`}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => {
                              const updatedItems = [...orderItems];
                              updatedItems[index].quantity = parseInt(e.target.value);
                              setOrderItems(updatedItems);
                            }}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeOrderItem(index)}>
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 border rounded-md">
                  <p className="text-sm text-gray-500">No se han agregado productos</p>
                </div>
              )}
              {orderItems.length > 0 && (
                <div className="text-right mt-4">
                  <p className="text-sm font-medium">Total: ${calculateTotal().toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOrderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrder}>
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
