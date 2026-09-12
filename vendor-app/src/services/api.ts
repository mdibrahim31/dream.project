import { Restaurant, FoodItem, Order } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL 
  ? `${(import.meta as any).env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` 
  : '/api';

export const api = {
  async getRestaurants(): Promise<Restaurant[]> {
    const res = await fetch(`${API_BASE}/restaurants`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return res.json();
  },

  async updateRestaurantStatus(id: string, isOpen: boolean): Promise<Restaurant> {
    const res = await fetch(`${API_BASE}/restaurants/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: isOpen })
    });
    if (!res.ok) throw new Error('Failed to update shop status');
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

  async createFoodItem(item: Partial<FoodItem>): Promise<FoodItem> {
    const res = await fetch(`${API_BASE}/food-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to add food item');
    return res.json();
  },

  async updateFoodItem(id: string, item: Partial<FoodItem>): Promise<FoodItem> {
    const res = await fetch(`${API_BASE}/food-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to update food item');
    return res.json();
  },

  async deleteFoodItem(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/food-items/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete food item');
    return res.json();
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async updateOrderStatus(id: string, status: Order['status'], prepMinutes?: number): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, prepMinutes })
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  async uploadImage(file: File): Promise<{ url: string; key?: string; bucket?: string; success: boolean }> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Data,
        filename: file.name,
        contentType: file.type
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to upload image to Supabase Storage');
    }

    return res.json();
  }
};
