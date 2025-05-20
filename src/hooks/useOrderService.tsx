
import { useState, useEffect } from 'react';
import { getOrders, getAllInvoices, getAllDeliveries, updateOrderStatus, getCustomers } from '@/services/order.service';
import { User } from '@/types/auth-types';
import { Order, Invoice, Delivery, OrderItem } from '@/types/order-types';

export function useOrderService() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    loadInvoices();
    loadDeliveries();
    loadCustomers();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = getOrders();
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
      return true;
    } catch (err) {
      setError('Error updating order status');
      console.error(err);
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
