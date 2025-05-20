
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  MapPin,
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  CalendarRange,
  MapIcon,
  UserCircle
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOrderService } from '@/hooks/useOrderService';
import { Order } from '@/types/order-types';

// Datos de domiciliarios
const deliveryPeople = [
  { id: 1, name: "Luis Torres", phone: "555-1234", status: "disponible", deliveries: 34, rating: 4.7 },
  { id: 2, name: "Ana García", phone: "555-5678", status: "disponible", deliveries: 27, rating: 4.9 },
  { id: 3, name: "Carlos López", phone: "555-9012", status: "ocupado", deliveries: 42, rating: 4.5 },
  { id: 4, name: "María Rodríguez", phone: "555-3456", status: "ocupado", deliveries: 18, rating: 4.8 },
  { id: 5, name: "Javier Sánchez", phone: "555-7890", status: "disponible", deliveries: 22, rating: 4.6 },
];

const Deliveries: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isAssignDeliveryDialogOpen, setIsAssignDeliveryDialogOpen] = useState(false);
  const [isViewDeliveryDialogOpen, setIsViewDeliveryDialogOpen] = useState(false);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<number | null>(null);
  const { toast } = useToast();
  const { orders: serviceOrders, loading, updateOrderStatus, loadOrders } = useOrderService();
  
  // Cargar pedidos
  useEffect(() => {
    const loadData = async () => {
      await loadOrders();
      setOrders(serviceOrders);
    };
    loadData();
  }, [serviceOrders]);
  
  // Pedidos que son entregas (preparados o enviados)
  const pendingDeliveries = orders.filter(order => 
    order.status === 'preparacion'
  );
  
  const activeDeliveries = orders.filter(order => 
    order.status === 'enviado'
  );
  
  const completedDeliveries = orders.filter(order => 
    order.status === 'entregado'
  );
  
  // Filtrar entregas según búsqueda, estado y pestaña
  const getFilteredDeliveries = () => {
    let filteredOrders: Order[] = [];
    
    switch (currentTab) {
      case 'pending':
        filteredOrders = pendingDeliveries;
        break;
      case 'active':
        filteredOrders = activeDeliveries;
        break;
      case 'completed':
        filteredOrders = completedDeliveries;
        break;
      case 'all':
      default:
        filteredOrders = [...pendingDeliveries, ...activeDeliveries, ...completedDeliveries];
        break;
    }
    
    return filteredOrders.filter(order => {
      const customerName = typeof order.customer === 'string' 
        ? order.customer.toLowerCase() 
        : order.customer?.name?.toLowerCase() || '';
      
      const orderNum = order.orderNumber?.toLowerCase() || '';
      
      return (searchQuery === '' || 
        customerName.includes(searchQuery.toLowerCase()) || 
        orderNum.includes(searchQuery.toLowerCase())) &&
        (statusFilter === 'all' || order.status === statusFilter);
    });
  };
  
  const filteredDeliveries = getFilteredDeliveries();
  
  // Asignar domiciliario
  const assignDeliveryPerson = async () => {
    if (!currentOrder || !selectedDeliveryPerson) {
      toast({
        title: "Error",
        description: "Debe seleccionar un domiciliario",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Buscar el domiciliario seleccionado
      const deliveryPerson = deliveryPeople.find(d => d.id === selectedDeliveryPerson);
      
      if (!deliveryPerson) {
        throw new Error("Domiciliario no encontrado");
      }
      
      // Actualizar el estado del pedido a enviado
      await updateOrderStatus(
        currentOrder.id,
        'enviado',
        deliveryPerson.id,
        deliveryPerson.name
      );
      
      // Actualizar la lista de pedidos
      await loadOrders();
      setOrders(serviceOrders);
      
      toast({
        title: "Domiciliario asignado",
        description: `${deliveryPerson.name} ha sido asignado al pedido #${currentOrder.orderNumber || currentOrder.id.substring(0, 8)}`
      });
      
      // Cerrar diálogo y limpiar selección
      setIsAssignDeliveryDialogOpen(false);
      setSelectedDeliveryPerson(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Ver detalle de entrega
  const viewDelivery = (order: Order) => {
    setCurrentOrder(order);
    setIsViewDeliveryDialogOpen(true);
  };
  
  // Marcar pedido como entregado
  const markAsDelivered = async () => {
    if (!currentOrder) return;
    
    try {
      // Actualizar el estado del pedido a entregado
      await updateOrderStatus(
        currentOrder.id,
        'entregado'
      );
      
      // Actualizar la lista de pedidos
      await loadOrders();
      setOrders(serviceOrders);
      
      toast({
        title: "Entrega completada",
        description: `El pedido #${currentOrder.orderNumber || currentOrder.id.substring(0, 8)} ha sido entregado exitosamente.`
      });
      
      // Cerrar diálogo
      setIsViewDeliveryDialogOpen(false);
    } catch (error: any) {
      console.error(error);
    }
  };
  
  // Mostrar badge según estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Pendiente</Badge>;
      case 'preparacion':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">En Preparación</Badge>;
      case 'enviado':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">En Camino</Badge>;
      case 'entregado':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Entregado</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Entregas</h1>
        <p className="text-muted-foreground">
          Gestión y seguimiento de entregas a domicilio.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-lg">Pendientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{pendingDeliveries.length}</div>
            <p className="text-sm text-muted-foreground">Pedidos listos para asignar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-lg">En Camino</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{activeDeliveries.length}</div>
            <p className="text-sm text-muted-foreground">Pedidos en proceso de entrega</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <CardTitle className="text-lg">Completadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{completedDeliveries.length}</div>
            <p className="text-sm text-muted-foreground">Entregas realizadas hoy</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <UserCircle className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-lg">Domiciliarios</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{deliveryPeople.filter(d => d.status === 'disponible').length}</div>
            <p className="text-sm text-muted-foreground">Disponibles actualmente</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Gestión de Entregas</CardTitle>
              <CardDescription>
                Administra y realiza seguimiento a las entregas de pedidos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
              <TabsList>
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                <TabsTrigger value="active">En Camino</TabsTrigger>
                <TabsTrigger value="completed">Completadas</TabsTrigger>
                <TabsTrigger value="all">Todas</TabsTrigger>
              </TabsList>
              
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por cliente o pedido..."
                    className="pl-8 md:w-[250px]"
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
                    <SelectItem value="preparacion">En Preparación</SelectItem>
                    <SelectItem value="enviado">En Camino</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Nº Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Domiciliario</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">{delivery.orderNumber || delivery.id.substring(0, 8)}</TableCell>
                        <TableCell>{typeof delivery.customer === 'string' ? delivery.customer : delivery.customer?.name}</TableCell>
                        <TableCell>{new Date(delivery.date || delivery.created_at || '').toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{delivery.address || delivery.shipping_address}</TableCell>
                        <TableCell>
                          {delivery.deliveryPersonName || (
                            <span className="text-muted-foreground italic">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">${(delivery.total || delivery.total_amount).toFixed(2)}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(delivery.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            {delivery.status === 'preparacion' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setCurrentOrder(delivery);
                                  setIsAssignDeliveryDialogOpen(true);
                                }}
                              >
                                Asignar
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewDelivery(delivery)}
                            >
                              Ver Detalles
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No se encontraron entregas que coincidan con los filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Asignar Domiciliario Dialog */}
      <Dialog open={isAssignDeliveryDialogOpen} onOpenChange={setIsAssignDeliveryDialogOpen}>
        <DialogContent className="max-w-md">
          {currentOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Asignar Domiciliario</DialogTitle>
                <DialogDescription>
                  Seleccione un domiciliario para el pedido #{currentOrder.orderNumber || currentOrder.id.substring(0, 8)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="mb-4">
                  <div className="bg-muted/30 rounded-md p-3 mb-4">
                    <h3 className="text-sm font-medium mb-2">Detalles del Pedido</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-medium">
                          {typeof currentOrder.customer === 'string' 
                            ? currentOrder.customer 
                            : currentOrder.customer?.name || ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dirección:</span>
                        <span className="font-medium max-w-[200px] text-right">
                          {currentOrder.address || currentOrder.shipping_address}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Productos:</span>
                        <span className="font-medium">{currentOrder.items?.length || 0} artículos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">${(currentOrder.total || currentOrder.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="delivery-person">Seleccionar Domiciliario</Label>
                    <Select 
                      value={selectedDeliveryPerson?.toString() || ''} 
                      onValueChange={(val) => setSelectedDeliveryPerson(parseInt(val))}
                    >
                      <SelectTrigger id="delivery-person">
                        <SelectValue placeholder="Seleccionar domiciliario" />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryPeople
                          .filter(person => person.status === 'disponible')
                          .map(person => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.name} ({person.rating} ★)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedDeliveryPerson && (
                      <div className="mt-4 p-3 bg-muted/20 rounded-md">
                        <h4 className="text-sm font-medium mb-2">Información del Domiciliario</h4>
                        {deliveryPeople
                          .filter(person => person.id === selectedDeliveryPerson)
                          .map(person => (
                            <div key={person.id} className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Teléfono:</span>
                                <span>{person.phone}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Entregas:</span>
                                <span>{person.deliveries} completadas</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Calificación:</span>
                                <span className="flex items-center">
                                  {person.rating}
                                  <span className="text-yellow-500 ml-1">★</span>
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignDeliveryDialogOpen(false)}>Cancelar</Button>
                <Button onClick={assignDeliveryPerson}>Asignar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Ver Detalle de Entrega Dialog */}
      <Dialog open={isViewDeliveryDialogOpen} onOpenChange={setIsViewDeliveryDialogOpen}>
        <DialogContent className="max-w-2xl">
          {currentOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Detalle de Entrega #{currentOrder.orderNumber || currentOrder.id.substring(0, 8)}
                </DialogTitle>
                <DialogDescription>
                  Pedido realizado el {new Date(currentOrder.date || currentOrder.created_at || '').toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center">
                        <UserCircle className="h-4 w-4 mr-1" />
                        Información del Cliente
                      </h3>
                      <div className="bg-muted/30 rounded-md p-3">
                        <p className="font-medium">
                          {typeof currentOrder.customer === 'string' 
                            ? currentOrder.customer 
                            : currentOrder.customer?.name || ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Cliente #{currentOrder.customer_id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Dirección de Entrega
                      </h3>
                      <div className="bg-muted/30 rounded-md p-3">
                        <p className="text-sm">{currentOrder.address || currentOrder.shipping_address}</p>
                      </div>
                    </div>
                    
                    {currentOrder.deliveryPersonName && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center">
                          <UserCircle className="h-4 w-4 mr-1" />
                          Domiciliario Asignado
                        </h3>
                        <div className="bg-muted/30 rounded-md p-3">
                          <p className="font-medium">{currentOrder.deliveryPersonName}</p>
                          {deliveryPeople.filter(d => d.id === currentOrder.deliveryPersonId).map(person => (
                            <div key={person.id} className="text-sm space-y-1 mt-2">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Teléfono:</span>
                                <span>{person.phone}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>Calificación:</span>
                                <span className="flex items-center">
                                  {person.rating}
                                  <span className="text-yellow-500 ml-1">★</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        Productos
                      </h3>
                      <div className="bg-muted/30 rounded-md p-3">
                        <ul className="space-y-2">
                          {currentOrder.items?.map((item, index) => (
                            <li key={index} className="text-sm flex justify-between">
                              <span>{item.quantity}x {item.productName || `Producto ${item.product_id.substring(0, 6)}`}</span>
                              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 pt-3 border-t flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${(currentOrder.total || currentOrder.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center">
                        <CalendarRange className="h-4 w-4 mr-1" />
                        Estado del Pedido
                      </h3>
                      <div className="bg-muted/30 rounded-md p-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium">Estado actual:</span>
                          {getStatusBadge(currentOrder.status)}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className="h-7 w-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Pedido recibido</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(currentOrder.date || currentOrder.created_at || '').toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center ${currentOrder.status === 'pendiente' ? 'opacity-50' : ''}`}>
                            <div className={`h-7 w-7 rounded-full mr-2 flex items-center justify-center ${currentOrder.status !== 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                              <Package className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">En preparación</p>
                              <p className="text-xs text-muted-foreground">
                                {currentOrder.status !== 'pendiente' ? 'Completado' : 'Pendiente'}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center ${currentOrder.status === 'pendiente' || currentOrder.status === 'preparacion' ? 'opacity-50' : ''}`}>
                            <div className={`h-7 w-7 rounded-full mr-2 flex items-center justify-center ${currentOrder.status === 'enviado' || currentOrder.status === 'entregado' ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}>
                              <Truck className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">En camino</p>
                              <p className="text-xs text-muted-foreground">
                                {currentOrder.status === 'enviado' || currentOrder.status === 'entregado' ? 'En proceso' : 'Pendiente'}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center ${currentOrder.status !== 'entregado' ? 'opacity-50' : ''}`}>
                            <div className={`h-7 w-7 rounded-full mr-2 flex items-center justify-center ${currentOrder.status === 'entregado' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Entregado</p>
                              <p className="text-xs text-muted-foreground">
                                {currentOrder.status === 'entregado' ? 'Completado' : 'Pendiente'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="space-x-2">
                {currentOrder.status === 'enviado' && (
                  <Button 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={markAsDelivered}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Entregado
                  </Button>
                )}
                {currentOrder.status === 'preparacion' && !currentOrder.deliveryPersonName && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsViewDeliveryDialogOpen(false);
                      setTimeout(() => {
                        setIsAssignDeliveryDialogOpen(true);
                      }, 100);
                    }}
                  >
                    Asignar Domiciliario
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setIsViewDeliveryDialogOpen(false)}
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

export default Deliveries;
