import { Restaurant, Category, FoodItem, Order } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL 
  ? `${(import.meta as any).env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` 
  : '/api';

export const api = {
  async getRestaurants(): Promise<Restaurant[]> {
    const res = await fetch(`${API_BASE}/restaurants`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getFoodItems(restaurantId?: string): Promise<FoodItem[]> {
    const url = restaurantId 
      ? `${API_BASE}/food-items?restaurantId=${restaurantId}`
      : `${API_BASE}/food-items`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch food items');
    return res.json();
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch order details');
    return res.json();
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  }
};
