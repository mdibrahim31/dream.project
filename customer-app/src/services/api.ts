import { Restaurant, Category, FoodItem, Order } from '../types';

function getApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('foodflow_backend_url') : null;
  if (storedUrl && storedUrl.trim() !== '') {
    return `${storedUrl.replace(/\/$/, '')}/api`;
  }
  return '/api';
}

export const api = {
  async getRestaurants(): Promise<Restaurant[]> {
    const res = await fetch(`${getApiBase()}/restaurants`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${getApiBase()}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getFoodItems(restaurantId?: string): Promise<FoodItem[]> {
    const url = restaurantId 
      ? `${getApiBase()}/food-items?restaurantId=${restaurantId}`
      : `${getApiBase()}/food-items`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch food items');
    return res.json();
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${getApiBase()}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await fetch(`${getApiBase()}/orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch order details');
    return res.json();
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const res = await fetch(`${getApiBase()}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  }
};
