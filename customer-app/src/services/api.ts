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

async function safeFetch(url: string, options?: RequestInit) {
  try {
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
  } catch (err) {
    throw err;
  }
}

// Mock fallback data for standalone/offline preview
const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: "Sultan's Dine",
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
  },
  {
    id: 'rest-2',
    name: "Kacchi Bhai",
    slug: 'kacchi-bhai',
    cuisine: 'Traditional Kacchi',
    rating: 4.9,
    delivery_time: '20-30 min',
    min_order: 250,
    delivery_fee: 60,
    image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80',
    banner_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1200&q=80',
    is_open: true,
    address: 'Dhanmondi 27, Dhaka',
    phone: '+8801822334455',
    vendor_id: 'vendor-2'
  }
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'All', icon: '🍽️' },
  { id: 'cat-2', name: 'Biryani', icon: '🍲' },
  { id: 'cat-3', name: 'Main Course', icon: '🍗' },
  { id: 'cat-4', name: 'Beverages', icon: '🥤' },
  { id: 'cat-5', name: 'Desserts', icon: '🍮' }
];

const MOCK_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'food-1',
    restaurant_id: 'rest-1',
    restaurant_name: "Sultan's Dine",
    vendor_name: "Sultan's Dine Kitchen",
    name: 'Kacchi Mutton Tehari',
    description: 'Tender mutton chunks layered with aromatic chinigura rice and secret spices.',
    price: 380,
    category: 'Biryani',
    image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80',
    is_available: true,
    is_popular: true
  },
  {
    id: 'food-2',
    restaurant_id: 'rest-1',
    restaurant_name: "Sultan's Dine",
    vendor_name: "Sultan's Dine Kitchen",
    name: 'Chicken Roast & Polao',
    description: 'Classic rich chicken roast served with fragrant ghee polao and boiled egg.',
    price: 290,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80',
    is_available: true,
    is_popular: true
  },
  {
    id: 'food-3',
    restaurant_id: 'rest-2',
    restaurant_name: "Kacchi Bhai",
    vendor_name: "Kacchi Bhai Kitchen",
    name: 'Special Kacchi Dum Biryani',
    description: 'Slow-cooked prime mutton with potatoes, saffron, and premium basmati rice.',
    price: 420,
    category: 'Biryani',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    is_available: true,
    is_popular: true
  }
];

export const api = {
  async getRestaurants(): Promise<Restaurant[]> {
    try {
      return await safeFetch(`${getApiBase()}/restaurants`);
    } catch {
      return MOCK_RESTAURANTS;
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      return await safeFetch(`${getApiBase()}/categories`);
    } catch {
      return MOCK_CATEGORIES;
    }
  },

  async getFoodItems(restaurantId?: string): Promise<FoodItem[]> {
    try {
      const url = restaurantId 
        ? `${getApiBase()}/food-items?restaurantId=${restaurantId}`
        : `${getApiBase()}/food-items`;
      return await safeFetch(url);
    } catch {
      if (restaurantId) {
        return MOCK_FOOD_ITEMS.filter(f => f.restaurant_id === restaurantId);
      }
      return MOCK_FOOD_ITEMS;
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      return await safeFetch(`${getApiBase()}/orders`);
    } catch {
      const local = localStorage.getItem('foodflow_customer_orders');
      return local ? JSON.parse(local) : [];
    }
  },

  async getOrderById(id: string): Promise<Order> {
    try {
      return await safeFetch(`${getApiBase()}/orders/${id}`);
    } catch {
      const local = localStorage.getItem('foodflow_customer_orders');
      const orders: Order[] = local ? JSON.parse(local) : [];
      const found = orders.find(o => o.id === id);
      if (found) return found;
      throw new Error('Order not found');
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
        restaurant_name: orderData.restaurant_name || "Sultan's Dine",
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
      const local = localStorage.getItem('foodflow_customer_orders');
      const orders: Order[] = local ? JSON.parse(local) : [];
      orders.unshift(newOrder);
      localStorage.setItem('foodflow_customer_orders', JSON.stringify(orders));
      return newOrder;
    }
  }
};

