
import { useState, useEffect } from 'react';
import { 
  getAllOrders, 
  getAllInvoices, 
  getAllDeliveries, 
  updateOrderStatus, 
  getCustomers,
  createOrder
} from '@/services/order.service';
import { useToast } from './use-toast';
import { Order, Invoice, Delivery, OrderItem, Customer } from '@/types/order-types';

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
      
      // Process orders to add required properties
      const processedOrders = data.map(order => ({
        ...order,
        orderNumber: `ORD-${order.id.substring(0, 8)}`,
        date: order.created_at,
        address: order.shipping_address,
        total: order.total_amount,
        customerId: order.customer_id,
      }));
      
      setOrders(processedOrders);
      setError(null);
      return processedOrders;
    } catch (err) {
      setError('Error loading orders');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getAllInvoices();
      
      // Process invoices to add required properties
      const processedInvoices = data.map(invoice => ({
        ...invoice,
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer?.name || `Cliente ${invoice.order?.customer_id.substring(0, 6)}`,
        customerAddress: invoice.order?.shipping_address || '',
        orderNumber: invoice.order ? `ORD-${invoice.order.id.substring(0, 8)}` : '',
        date: invoice.issue_date,
        total: invoice.total_amount,
        subtotal: invoice.total_amount - invoice.tax_amount,
        tax: invoice.tax_amount
      }));
      
      setInvoices(processedInvoices);
      setError(null);
      return processedInvoices;
    } catch (err) {
      setError('Error loading invoices');
      console.error(err);
      return [];
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
      return data;
    } catch (err) {
      setError('Error loading deliveries');
      console.error(err);
      return [];
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
      return data;
    } catch (err) {
      setError('Error loading customers');
      console.error(err);
      return [];
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

  const handleCreateOrder = async (
    customerId: string,
    items: OrderItem[],
    shippingAddress: string,
    totalAmount: number
  ) => {
    try {
      setLoading(true);
      const newOrder = await createOrder(customerId, items, shippingAddress, totalAmount);
      await loadOrders();
      
      if (newOrder) {
        toast({
          title: "Orden creada",
          description: `Orden creada exitosamente`,
        });
      }
      
      return newOrder;
    } catch (err) {
      setError('Error creating order');
      console.error(err);
      
      toast({
        title: "Error",
        description: "No se pudo crear la orden",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add a payInvoice function for Invoices.tsx
  const payInvoice = async (invoiceId: string) => {
    try {
      // This is just a mock implementation since we don't have a backend endpoint yet
      // In a real application, you would call a service function to update the invoice status
      const updatedInvoices = invoices.map(invoice => {
        if (invoice.id === invoiceId) {
          return { ...invoice, status: 'pagada' };
        }
        return invoice;
      });
      
      setInvoices(updatedInvoices);
      
      toast({
        title: "Factura pagada",
        description: `La factura ha sido marcada como pagada`,
      });
      
      return updatedInvoices.find(invoice => invoice.id === invoiceId);
    } catch (err) {
      console.error(err);
      
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la factura",
        variant: "destructive",
      });
      
      return null;
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
    updateOrderStatus: handleUpdateOrderStatus,
    createOrder: handleCreateOrder,
    payInvoice
  };
}

export type { Order, Invoice, Delivery, OrderItem, Customer };
