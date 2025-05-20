
import { User } from '@/types/auth-types';

export interface Order {
  id: string;
  customer_id: string;
  status: string;
  shipping_address: string;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
  customer?: User;
  
  // Additional properties needed by components
  orderNumber?: string;
  date?: string;
  address?: string;
  deliveryPersonName?: string;
  deliveryPersonId?: number;
  total?: number;
  customerId?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  quantity: number;
  price: number;
  warehouse_id?: string;
  subtotal?: number;
  productName?: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  tax_amount: number;
  status: string;
  pdf_url?: string;
  order?: Order;
  customer?: User;
  
  // Additional properties needed by components
  customerName?: string;
  invoiceNumber?: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  delivery_person_id: string;
  status: string;
  assigned_at?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  notes?: string;
  order?: Order;
  delivery_person?: User;
}
