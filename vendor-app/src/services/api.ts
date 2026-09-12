import { Restaurant, FoodItem, Order } from '../types';

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

  async updateRestaurantStatus(id: string, isOpen: boolean): Promise<Restaurant> {
    const res = await fetch(`${getApiBase()}/restaurants/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: isOpen })
    });
    if (!res.ok) throw new Error('Failed to update shop status');
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

  async createFoodItem(item: Partial<FoodItem>): Promise<FoodItem> {
    const res = await fetch(`${getApiBase()}/food-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to add food item');
    return res.json();
  },

  async updateFoodItem(id: string, item: Partial<FoodItem>): Promise<FoodItem> {
    const res = await fetch(`${getApiBase()}/food-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to update food item');
    return res.json();
  },

  async deleteFoodItem(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${getApiBase()}/food-items/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete food item');
    return res.json();
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${getApiBase()}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async updateOrderStatus(id: string, status: Order['status'], prepMinutes?: number): Promise<Order> {
    const res = await fetch(`${getApiBase()}/orders/${id}/status`, {
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

    const res = await fetch(`${getApiBase()}/upload`, {
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
