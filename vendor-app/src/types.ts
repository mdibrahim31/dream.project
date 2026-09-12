export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  rating: number;
  delivery_time: string;
  min_order: number;
  delivery_fee: number;
  image_url: string;
  banner_url: string;
  is_open: boolean;
  address: string;
  phone: string;
  vendor_id?: string;
}

export interface FoodItem {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  vendor_name?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  is_popular?: boolean;
}

export interface OrderItem {
  food_id: string;
  name: string;
  price: number;
  quantity: number;
  instructions?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  restaurant_id: string;
  restaurant_name: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'placed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  rider_id?: string;
  rider_name?: string;
  rider_phone?: string;
  created_at: string;
  estimated_delivery_time?: string;
  notes?: string;
}
