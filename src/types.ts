export type PortalView = 'customer' | 'vendor' | 'admin' | 'telegram-bots';

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

export interface Category {
  id: string;
  name: string;
  icon: string;
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

export interface CartItem {
  food: FoodItem;
  quantity: number;
  instructions?: string;
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
  status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'online';
  payment_status: 'pending' | 'paid';
  rider_id?: string;
  rider_name?: string;
  rider_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  telegram_chat_id?: string;
  is_online: boolean;
  current_location: string;
  total_deliveries: number;
  total_earnings: number;
  status: 'available' | 'busy' | 'offline';
  rating: number;
}

export interface Vendor {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  telegram_chat_id?: string;
  email: string;
  is_active: boolean;
}

export interface TelegramMessage {
  id: string;
  botType: 'rider' | 'vendor';
  chatId: string;
  sender: 'bot' | 'user';
  text: string;
  inlineButtons?: { text: string; callbackData: string }[][];
  timestamp: string;
}

export interface AdminStats {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  totalGMV: number;
  platformCommission: number;
  totalRestaurants: number;
  openRestaurants: number;
  totalRiders: number;
  onlineRiders: number;
  totalVendors: number;
  dbStatus: {
    initialized: boolean;
    usingPostgres: boolean;
    tablesCreated: string[];
    bucketCreated: boolean;
    error: string | null;
    lastChecked: string;
  };
  pingStats: PingStats;
}

export interface PingStats {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  uptimeFormatted: string;
  totalPingsReceived: number;
  lastPingAt: string;
  serverTime: string;
  environment: string;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  selfHeartbeatEnabled: boolean;
  nextScheduledPingInSeconds: number;
}

export interface PingLog {
  timestamp: string;
  source: string;
  status: number;
  durationMs: number;
}
