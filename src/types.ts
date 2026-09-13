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
  vendor_id: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface FoodItem {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  vendor_name: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  is_popular?: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
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
  status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'bkash' | 'card';
  payment_status: 'pending' | 'paid';
  prep_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  is_online: boolean;
  total_deliveries: number;
  total_earnings: number;
  current_location: string;
}

export interface BotMessage {
  id: string;
  botType: 'rider' | 'vendor';
  chatId: string;
  sender: 'user' | 'bot';
  text: string;
  inlineButtons?: { text: string; callbackData: string }[][];
  timestamp: string;
}
