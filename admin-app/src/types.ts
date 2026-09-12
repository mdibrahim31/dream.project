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
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  telegram_chat_id?: string;
  is_online: boolean;
  current_location: string;
  rating: number;
  total_deliveries: number;
  total_earnings: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  restaurant_id: string;
  restaurant_name: string;
  items: Array<{
    food_id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'placed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  rider_id?: string;
  rider_name?: string;
  created_at: string;
}

export interface AdminStats {
  totalOrders: number;
  activeOrders: number;
  totalGMV: number;
  platformCommission: number;
  totalRiders: number;
  onlineRiders: number;
  totalRestaurants: number;
  activeRestaurants: number;
  dbStatus: {
    usingPostgres: boolean;
    tablesCreated: string[];
    lastChecked: string;
  };
}

export interface PingStats {
  totalPingsReceived: number;
  lastPingTimestamp: string | null;
  serverStartedAt: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}
