import { Restaurant, Category, FoodItem, Order, Rider, Vendor, TelegramMessage, AdminStats, PingLog } from '../types';

const BASE_URL = '/api';

export const api = {
  // Ping & Health
  async getPing(): Promise<any> {
    const res = await fetch(`${BASE_URL}/ping?source=ui-heartbeat`);
    return res.json();
  },

  async getHealth(): Promise<any> {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async getPingLogs(): Promise<{ stats: any; logs: PingLog[] }> {
    const res = await fetch(`${BASE_URL}/ping/logs`);
    return res.json();
  },

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    const res = await fetch(`${BASE_URL}/restaurants`);
    return res.json();
  },

  async getRestaurantById(id: string): Promise<Restaurant> {
    const res = await fetch(`${BASE_URL}/restaurants/${id}`);
    return res.json();
  },

  async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<Restaurant> {
    const res = await fetch(`${BASE_URL}/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/categories`);
    return res.json();
  },

  // Menu Items
  async getFoodItems(restaurantId?: string): Promise<FoodItem[]> {
    const url = restaurantId ? `${BASE_URL}/menu?restaurant_id=${restaurantId}` : `${BASE_URL}/menu`;
    const res = await fetch(url);
    return res.json();
  },

  async createFoodItem(item: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    const res = await fetch(`${BASE_URL}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },

  async updateFoodItem(id: string, updates: Partial<FoodItem>): Promise<FoodItem> {
    const res = await fetch(`${BASE_URL}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async deleteFoodItem(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/menu/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Orders
  async getOrders(filter?: { restaurant_id?: string; rider_id?: string; status?: string }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filter?.restaurant_id) params.append('restaurant_id', filter.restaurant_id);
    if (filter?.rider_id) params.append('rider_id', filter.rider_id);
    if (filter?.status) params.append('status', filter.status);

    const res = await fetch(`${BASE_URL}/orders?${params.toString()}`);
    return res.json();
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders/${id}`);
    return res.json();
  },

  async createOrder(data: any): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateOrderStatus(id: string, status: Order['status'], riderDetails?: { rider_id?: string; rider_name?: string; rider_phone?: string }): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...riderDetails })
    });
    return res.json();
  },

  // Riders
  async getRiders(): Promise<Rider[]> {
    const res = await fetch(`${BASE_URL}/riders`);
    return res.json();
  },

  async updateRiderStatus(id: string, is_online: boolean, current_location?: string): Promise<Rider> {
    const res = await fetch(`${BASE_URL}/riders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_online, current_location })
    });
    return res.json();
  },

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    const res = await fetch(`${BASE_URL}/vendors`);
    return res.json();
  },

  // Admin & System
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${BASE_URL}/admin/stats`);
    return res.json();
  },

  async triggerDbInit(): Promise<{ success: boolean; status: any }> {
    const res = await fetch(`${BASE_URL}/system/db-init`, {
      method: 'POST'
    });
    return res.json();
  },

  // Telegram Simulator
  async getBotMessages(botType?: 'rider' | 'vendor'): Promise<TelegramMessage[]> {
    const url = botType ? `${BASE_URL}/telegram/simulator/messages?bot_type=${botType}` : `${BASE_URL}/telegram/simulator/messages`;
    const res = await fetch(url);
    return res.json();
  },

  async sendBotMessage(bot_type: 'rider' | 'vendor', text: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/telegram/simulator/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_type, text })
    });
    return res.json();
  },

  async sendBotCallback(bot_type: 'rider' | 'vendor', callback_data: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/telegram/simulator/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_type, callback_data })
    });
    return res.json();
  },

  async getTelegramStatus(): Promise<any> {
    const res = await fetch(`${BASE_URL}/telegram/status`);
    return res.json();
  }
};
