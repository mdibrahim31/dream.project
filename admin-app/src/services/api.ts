import { Restaurant, Rider, Order, AdminStats, PingStats } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL 
  ? `${(import.meta as any).env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` 
  : '/api';

export const api = {
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async getRiders(): Promise<Rider[]> {
    const res = await fetch(`${API_BASE}/riders`);
    if (!res.ok) throw new Error('Failed to fetch riders');
    return res.json();
  },

  async updateRiderStatus(id: string, isOnline: boolean): Promise<Rider> {
    const res = await fetch(`${API_BASE}/riders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_online: isOnline })
    });
    if (!res.ok) throw new Error('Failed to update rider status');
    return res.json();
  },

  async getRestaurants(): Promise<Restaurant[]> {
    const res = await fetch(`${API_BASE}/restaurants`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return res.json();
  },

  async getPingLogs(): Promise<{ stats: PingStats; logs: any[] }> {
    const res = await fetch(`${API_BASE}/ping-logs`);
    if (!res.ok) throw new Error('Failed to fetch ping logs');
    return res.json();
  },

  async triggerDbInit(): Promise<any> {
    const res = await fetch(`${API_BASE}/init-db`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger db init');
    return res.json();
  }
};
