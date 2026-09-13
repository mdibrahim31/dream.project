import { Restaurant, Category, FoodItem, Order, BotMessage } from '../types';

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

async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Received non-JSON response from server');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

export const api = {
  async getRestaurants(): Promise<Restaurant[]> {
    try {
      return await safeFetch(`${getApiBase()}/restaurants`);
    } catch {
      return [
        {
          id: 'rest-1',
          name: "Sultans Dine",
          slug: 'sultans-dine',
          cuisine: 'Biryani & Mughlai',
          rating: 4.8,
          delivery_time: '25-35 min',
          min_order: 200,
          delivery_fee: 50,
          image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
          banner_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
          is_open: true,
          address: 'Gulshan 2, Dhaka',
          phone: '+8801711122334',
          vendor_id: 'vendor-1'
        }
      ];
    }
  },

  async updateRestaurantStatus(id: string, isOpen: boolean): Promise<Restaurant> {
    try {
      return await safeFetch(`${getApiBase()}/restaurants/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: isOpen })
      });
    } catch {
      return { id, name: "Sultans Dine", is_open: isOpen } as any;
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      return await safeFetch(`${getApiBase()}/categories`);
    } catch {
      return [
        { id: 'cat-1', name: 'All', icon: '🍽️' },
        { id: 'cat-2', name: 'Biryani', icon: '🍲' },
        { id: 'cat-3', name: 'Main Course', icon: '🍗' }
      ];
    }
  },

  async getFoodItems(restaurantId?: string): Promise<FoodItem[]> {
    try {
      const url = restaurantId 
        ? `${getApiBase()}/food-items?restaurantId=${restaurantId}`
        : `${getApiBase()}/food-items`;
      return await safeFetch(url);
    } catch {
      const local = localStorage.getItem('foodflow_food_items');
      if (local) return JSON.parse(local);
      return [
        {
          id: 'food-1',
          restaurant_id: 'rest-1',
          restaurant_name: "Sultans Dine",
          vendor_name: "Sultans Dine Kitchen",
          name: 'Kacchi Mutton Tehari',
          description: 'Tender mutton chunks layered with aromatic chinigura rice and secret spices.',
          price: 380,
          category: 'Biryani',
          image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80',
          is_available: true,
          is_popular: true
        }
      ];
    }
  },

  async createFoodItem(item: Partial<FoodItem>): Promise<FoodItem> {
    try {
      const res = await safeFetch(`${getApiBase()}/food-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return res;
    } catch {
      const newItem: FoodItem = {
        id: `food-${Date.now()}`,
        restaurant_id: item.restaurant_id || 'rest-1',
        restaurant_name: item.restaurant_name || "Sultans Dine",
        vendor_name: item.vendor_name || "Sultans Dine Kitchen",
        name: item.name || 'New Dish',
        description: item.description || '',
        price: item.price || 300,
        category: item.category || 'Main Course',
        image_url: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        is_available: item.is_available ?? true,
        is_popular: item.is_popular ?? false
      };
      const local = localStorage.getItem('foodflow_food_items');
      const items: FoodItem[] = local ? JSON.parse(local) : [];
      items.unshift(newItem);
      localStorage.setItem('foodflow_food_items', JSON.stringify(items));
      return newItem;
    }
  },

  async updateFoodItem(id: string, item: Partial<FoodItem>): Promise<FoodItem> {
    try {
      return await safeFetch(`${getApiBase()}/food-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch {
      return { id, ...item } as any;
    }
  },

  async deleteFoodItem(id: string): Promise<{ success: boolean }> {
    try {
      return await safeFetch(`${getApiBase()}/food-items/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: true };
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      return await safeFetch(`${getApiBase()}/orders`);
    } catch {
      const local = localStorage.getItem('foodflow_orders');
      return local ? JSON.parse(local) : [];
    }
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    try {
      return await safeFetch(`${getApiBase()}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    } catch {
      const newOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_name: orderData.customer_name || 'Valued Customer',
        customer_phone: orderData.customer_phone || '+8801700000000',
        delivery_address: orderData.delivery_address || 'Gulshan, Dhaka',
        restaurant_id: orderData.restaurant_id || 'rest-1',
        restaurant_name: orderData.restaurant_name || "Sultans Dine",
        items: orderData.items || [],
        subtotal: orderData.subtotal || 380,
        delivery_fee: orderData.delivery_fee || 50,
        total: orderData.total || 430,
        status: 'placed',
        payment_method: orderData.payment_method || 'cod',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const local = localStorage.getItem('foodflow_orders');
      const orders: Order[] = local ? JSON.parse(local) : [];
      orders.unshift(newOrder);
      localStorage.setItem('foodflow_orders', JSON.stringify(orders));
      return newOrder;
    }
  },

  async updateOrderStatus(id: string, status: Order['status'], prepMinutes?: number): Promise<Order> {
    try {
      return await safeFetch(`${getApiBase()}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, prepMinutes })
      });
    } catch {
      return { id, status } as any;
    }
  },

  async uploadImage(file: File): Promise<{ url: string }> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      return await safeFetch(`${getApiBase()}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          filename: file.name,
          contentType: file.type
        })
      });
    } catch {
      return { url: base64 };
    }
  },

  async getBotMessages(botType: 'rider' | 'vendor', chatId?: string): Promise<BotMessage[]> {
    try {
      const url = chatId ? `${getApiBase()}/telegram/${botType}/messages?chatId=${chatId}` : `${getApiBase()}/telegram/${botType}/messages`;
      return await safeFetch(url);
    } catch {
      return [];
    }
  },

  async sendBotMessage(botType: 'rider' | 'vendor', chatId: string, text: string): Promise<{ success: boolean; messages: BotMessage[] }> {
    try {
      return await safeFetch(`${getApiBase()}/telegram/${botType}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, text })
      });
    } catch {
      return { success: true, messages: [] };
    }
  }
};
