export interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;

  category: {
    _id: string;
    name: string;
  };
  status: 'active' | 'inactive';
  stockAvailable: number;
  inStock: boolean;
  images?: string[];
  stockByWarehouse?: {
    warehouse: {
      _id: string;
      name: string;
    };
    quantity: number;
  }[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  product: string | any; // Product ID or populated Product
  quantity: number;
  price: number;
  warehouse?: string;
}

export interface Order {
  _id: string;
  customerId: any;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  createdAt: Date;
}

export interface RefundRequest {
  orderId: string;
  items: {
    product: string;
    quantity: number;
  }[];
  reason: string;
}

export interface AuthResponse {
  token: string;
  customer: Customer;
}
