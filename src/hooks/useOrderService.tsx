
import { useState, useEffect } from 'react';
import { 
  getAllOrders, 
  getAllInvoices, 
  getAllDeliveries, 
  updateOrderStatus, 
  getCustomers,
  Customer,
  Order,
  Invoice,
  Delivery,
  OrderItem
} from '@/services/order.service';
import { useToast } from './use-toast';

export function useOrderService() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
    loadInvoices();
    loadDeliveries();
    loadCustomers();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError('Error loading orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getAllInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError('Error loading invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const data = await getAllDeliveries();
      setDeliveries(data);
      setError(null);
    } catch (err) {
      setError('Error loading deliveries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('Error loading customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, deliveryPersonId?: number, deliveryPersonName?: string) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, status, deliveryPersonId, deliveryPersonName);
      await loadOrders();
      
      toast({
        title: "Estado actualizado",
        description: `Orden ${orderId} actualizada a ${status}`,
      });
      
      return true;
    } catch (err) {
      setError('Error updating order status');
      console.error(err);
      
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la orden",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    invoices,
    deliveries,
    customers,
    loading,
    error,
    loadOrders,
    loadInvoices,
    loadDeliveries,
    loadCustomers,
    updateOrderStatus: handleUpdateOrderStatus
  };
}

export type { Order, Invoice, Delivery, OrderItem };
