import React, { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOrderService } from '@/services/order.service';
import { User } from '@/types/auth-types';

const Deliveries = () => {
  const { deliveries, orders, loading, loadDeliveries, updateOrderStatus } = useOrderService();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isViewDeliveryDialogOpen, setIsViewDeliveryDialogOpen] = useState<boolean>(false);
  const [currentDelivery, setCurrentDelivery] = useState<any>(null);
  const [deliveryPersons, setDeliveryPersons] = useState<User[]>([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<User | null>(null);
  const { toast } = useToast();

  // Filter deliveries based on search query and status filter
  const filteredDeliveries = deliveries.filter((delivery) => {
    // Filter by search query
    const orderNumber = delivery.order ? `ORD-${delivery.order.id.substring(0, 8)}` : '';
    const deliveryPersonName = delivery.delivery_person?.name || '';
    
    const searchMatch = 
      orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deliveryPersonName.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by status
    let statusMatch = true;
    if (statusFilter !== 'todos') {
      statusMatch = delivery.status.toLowerCase() === statusFilter.toLowerCase();
    }

    return searchMatch && statusMatch;
  });

  // View delivery details
  const viewDeliveryDetails = (delivery: any) => {
    setCurrentDelivery(delivery);
    setIsViewDeliveryDialogOpen(true);
  };

  // Handle updating delivery status
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      toast({
        title: "Éxito",
        description: `Estado actualizado a ${newStatus}`,
      });
      
      // Refresh deliveries list
      await loadDeliveries();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  // Assign delivery person to an order
  const assignDeliveryPerson = async (orderId: string) => {
    if (!selectedDeliveryPerson) {
      toast({
        title: "Error",
        description: "Por favor, seleccione un repartidor",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateOrderStatus(
        orderId, 
        'en proceso', 
        parseInt(selectedDeliveryPerson.id), 
        selectedDeliveryPerson.name
      );
      
      toast({
        title: "Éxito",
        description: `Repartidor asignado: ${selectedDeliveryPerson.name}`,
      });
      
      // Refresh deliveries list and close dialog
      await loadDeliveries();
      setIsViewDeliveryDialogOpen(false);
    } catch (error) {
      console.error('Error assigning delivery person:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el repartidor",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Entregas</CardTitle>
          <CardDescription>Gestiona todas las entregas de pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2 w-1/2">
              <Input
                placeholder="Buscar entregas..."
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
            <Button onClick={() => loadDeliveries()}>Actualizar</Button>
          </div>

          {/* Deliveries Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Nº Orden</TableHead>
                  <TableHead>Repartidor</TableHead>
                  <TableHead>Fecha Asignación</TableHead>
                  <TableHead>Entrega Estimada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Cargando entregas...</TableCell>
                  </TableRow>
                ) : filteredDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No se encontraron entregas</TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        {delivery.order ? `ORD-${delivery.order.id.substring(0, 8)}` : 'N/A'}
                      </TableCell>
                      <TableCell>{delivery.delivery_person?.name || 'No asignado'}</TableCell>
                      <TableCell>{delivery.assigned_at ? new Date(delivery.assigned_at).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{delivery.estimated_delivery ? new Date(delivery.estimated_delivery).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={delivery.status === 'entregado' ? 'default' : 
                               delivery.status === 'cancelado' ? 'destructive' :
                               delivery.status === 'pendiente' ? 'secondary' :
                               delivery.status === 'enviado' ? 'outline' : 'default'}>
                          {delivery.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Acciones
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewDeliveryDetails(delivery)}>
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(delivery.order_id, 'enviado')}>
                              Marcar como enviado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(delivery.order_id, 'entregado')}>
                              Marcar como entregado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(delivery.order_id, 'cancelado')}>
                              Cancelar entrega
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

      {/* View Delivery Dialog */}
      <Dialog open={isViewDeliveryDialogOpen} onOpenChange={setIsViewDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {currentDelivery && (
            <>
              <DialogHeader>
                <DialogTitle>Detalles de Entrega</DialogTitle>
                <DialogDescription>
                  Orden: {currentDelivery.order ? `ORD-${currentDelivery.order.id.substring(0, 8)}` : 'N/A'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">ID de Entrega:</p>
                    <p className="text-sm">{currentDelivery.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">ID de Orden:</p>
                    <p className="text-sm">{currentDelivery.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Repartidor:</p>
                    <p className="text-sm">{currentDelivery.delivery_person?.name || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estado:</p>
                    <p className="text-sm">{currentDelivery.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fecha de Asignación:</p>
                    <p className="text-sm">{currentDelivery.assigned_at ? new Date(currentDelivery.assigned_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Entrega Estimada:</p>
                    <p className="text-sm">{currentDelivery.estimated_delivery ? new Date(currentDelivery.estimated_delivery).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Entrega Real:</p>
                    <p className="text-sm">{currentDelivery.actual_delivery ? new Date(currentDelivery.actual_delivery).toLocaleDateString() : 'Pendiente'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Notas:</p>
                    <p className="text-sm">{currentDelivery.notes || 'Sin notas'}</p>
                  </div>
                </div>
                
                {currentDelivery.order && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Información de la Orden:</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Cliente:</p>
                        <p className="text-sm">{typeof currentDelivery.order.customer === 'string' ? currentDelivery.order.customer : currentDelivery.order.customer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Dirección de Envío:</p>
                        <p className="text-sm">{currentDelivery.order.shipping_address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total:</p>
                        <p className="text-sm">${currentDelivery.order.total_amount?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Fecha de Orden:</p>
                        <p className="text-sm">{currentDelivery.order.created_at ? new Date(currentDelivery.order.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentDelivery.status !== 'entregado' && currentDelivery.status !== 'cancelado' && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Actualizar estado:</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => handleUpdateStatus(currentDelivery.order_id, 'pendiente')}>
                        Pendiente
                      </Button>
                      <Button variant="outline" onClick={() => handleUpdateStatus(currentDelivery.order_id, 'en proceso')}>
                        En Proceso
                      </Button>
                      <Button variant="outline" onClick={() => handleUpdateStatus(currentDelivery.order_id, 'enviado')}>
                        Enviado
                      </Button>
                      <Button variant="outline" onClick={() => handleUpdateStatus(currentDelivery.order_id, 'entregado')}>
                        Entregado
                      </Button>
                      <Button variant="destructive" onClick={() => handleUpdateStatus(currentDelivery.order_id, 'cancelado')}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {!currentDelivery.delivery_person && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Asignar Repartidor:</h3>
                    <div className="flex space-x-2">
                      <Select
                        value={selectedDeliveryPerson?.id}
                        onValueChange={(value) => {
                          const person = deliveryPersons.find(p => p.id === value);
                          setSelectedDeliveryPerson(person || null);
                        }}
                      >
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Seleccionar repartidor" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryPersons.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => assignDeliveryPerson(currentDelivery.order_id)}>
                        Asignar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDeliveryDialogOpen(false)}>
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
