
import { supabase } from '@/integrations/supabase/client';
import { Order, Invoice, Delivery, OrderItem, Customer } from '@/types/order-types';

/**
 * Obtener todas las órdenes
 */
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*), customer:users(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    return [];
  }
};

/**
 * Obtener órdenes de un cliente
 */
export const getCustomerOrders = async (customerId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching customer orders:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCustomerOrders:", error);
    return [];
  }
};

/**
 * Crear una nueva orden
 */
export const createOrder = async (
  customerId: string,
  items: OrderItem[],
  shippingAddress: string,
  totalAmount: number
): Promise<Order | null> => {
  try {
    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        status: 'pendiente',
        shipping_address: shippingAddress,
        total_amount: totalAmount,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return null;
    }

    // Crear los items de la orden
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Intentar eliminar la orden creada para no dejar datos huérfanos
      await supabase.from('orders').delete().eq('id', order.id);
      return null;
    }

    return {
      ...order,
      items
    };
  } catch (error) {
    console.error("Error in createOrder:", error);
    return null;
  }
};

/**
 * Actualizar el estado de una orden
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
  deliveryPersonId?: number,
  deliveryPersonName?: string
): Promise<boolean> => {
  try {
    const updateData: any = {
      status
    };

    if (deliveryPersonId) {
      updateData.delivery_person_id = deliveryPersonId;
      updateData.delivery_person_name = deliveryPersonName;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error("Error updating order status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return false;
  }
};

/**
 * Obtener todas las facturas
 */
export const getAllInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, order:orders(*), customer:users(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllInvoices:", error);
    return [];
  }
};

/**
 * Obtener facturas de un cliente
 */
export const getCustomerInvoices = async (customerId: string): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, order:orders(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching customer invoices:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCustomerInvoices:", error);
    return [];
  }
};

/**
 * Obtener todas las entregas
 */
export const getAllDeliveries = async (): Promise<Delivery[]> => {
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*, order:orders(*), delivery_person:users(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching deliveries:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllDeliveries:", error);
    return [];
  }
};

/**
 * Obtener clientes (usuarios con rol 'cliente')
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'cliente');

    if (error) {
      console.error("Error fetching customers:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCustomers:", error);
    return [];
  }
};

export type { Customer, Order, Invoice, Delivery, OrderItem };
