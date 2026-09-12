import React, { useState, useEffect } from 'react';
import { AdminStats, Order, Rider, Restaurant } from './types';
import { api } from './services/api';
import { 
  ShieldCheck, 
  DollarSign, 
  ShoppingBag, 
  Bike, 
  Store, 
  Database, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Check
} from 'lucide-react';

export default function AdminApp() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'riders' | 'database' | 'keepalive'>('overview');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isReinitializing, setIsReinitializing] = useState<boolean>(false);
  const [initMsg, setInitMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [adminStats, ords, rds, rests] = await Promise.all([
        api.getAdminStats(),
        api.getOrders(),
        api.getRiders(),
        api.getRestaurants()
      ]);
      setStats(adminStats);
      setOrders(ords);
      setRiders(rds);
      setRestaurants(rests);
    } catch (err) {
      console.error('Admin load data error:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleToggleRider = async (riderId: string, currentStatus: boolean) => {
    try {
      await api.updateRiderStatus(riderId, !currentStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderStatusOverride = async (orderId: string, status: Order['status']) => {
    try {
      await api.updateOrderStatus(orderId, status);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualDbInit = async () => {
    try {
      setIsReinitializing(true);
      await api.triggerDbInit();
      setInitMsg('✅ Supabase database verification & auto-tables check completed successfully!');
      setTimeout(() => setInitMsg(null), 6000);
      loadData();
    } catch (err: any) {
      setInitMsg(`⚠️ Database sync error: ${err.message}`);
    } finally {
      setIsReinitializing(false);
    }
  };

  const currentPingUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/ping` : 'http://localhost:3000/api/ping';

  const copyPingUrl = () => {
    navigator.clipboard.writeText(currentPingUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      
      {/* Standalone Super Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-white">Platform Master Control</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Connected to Supabase DB • Central Express Backend
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualDbInit}
              disabled={isReinitializing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all border border-slate-700"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>{isReinitializing ? 'Checking...' : 'Check DB Tables'}</span>
            </button>
            <button
              onClick={loadData}
              className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-2 py-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              📊 System Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'orders' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              📦 Master Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('riders')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'riders' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              🛵 Rider Fleet ({riders.length})
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'database' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              🗄️ Supabase Auto-Migration
            </button>
            <button
              onClick={() => setActiveTab('keepalive')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'keepalive' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
              }`}
            >
              ⚡ Render 24/7 Keep-Alive
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {initMsg && (
          <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
            <span>{initMsg}</span>
            <button onClick={() => setInitMsg(null)} className="font-bold text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total GMV</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white mt-2">৳{stats?.totalGMV || 0}</p>
                <p className="text-[11px] text-emerald-400 mt-1 font-medium">All platform gross sales</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Commission (15%)</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-2">৳{stats?.platformCommission || 0}</p>
                <p className="text-[11px] text-slate-400 mt-1">Platform net earnings</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Orders</span>
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-2xl font-black text-sky-400 mt-2">{stats?.activeOrders || 0}</p>
                <p className="text-[11px] text-slate-400 mt-1">In kitchen / Out for delivery</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Riders Online</span>
                  <Bike className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 mt-2">{stats?.onlineRiders || 0} / {stats?.totalRiders || 0}</p>
                <p className="text-[11px] text-slate-400 mt-1">Connected to Rider Bot dispatch</p>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
              <h3 className="font-bold text-base text-white">Decoupled Architecture Live Map</h3>
              <p className="text-xs text-slate-400">
                All 3 independent frontend applications and 2 Telegram bots are connected to the central backend REST API and single Supabase PostgreSQL database.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                  <span className="font-bold text-amber-400 block mb-1">1. Customer App</span>
                  <p className="text-slate-400">Orders placed here trigger live notifications to the Vendor Bot & Vendor Dashboard.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                  <span className="font-bold text-emerald-400 block mb-1">2. Vendor App</span>
                  <p className="text-slate-400">Menu changes and order acceptance trigger auto rider lookup & dispatch.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                  <span className="font-bold text-sky-400 block mb-1">3. Telegram Bots</span>
                  <p className="text-slate-400">Vendor Bot & Rider Bot use webhooks to dispatch & update deliveries.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">All Platform Orders ({orders.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Restaurant</th>
                    <th className="px-4 py-3">Rider</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Admin Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-white">#{o.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-200 block">{o.customer_name}</span>
                        <span className="text-[10px] text-slate-400">{o.customer_phone}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{o.restaurant_name}</td>
                      <td className="px-4 py-3 text-sky-400 font-medium">{o.rider_name || 'Unassigned'}</td>
                      <td className="px-4 py-3 font-bold text-amber-400">৳{o.total}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => handleOrderStatusOverride(o.id, e.target.value as any)}
                          className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2 py-1"
                        >
                          <option value="placed">Placed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RIDERS TAB */}
        {activeTab === 'riders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riders.map(r => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{r.name}</h4>
                    <p className="text-xs text-slate-400">{r.phone} • {r.current_location}</p>
                    <div className="flex items-center space-x-3 mt-1.5 text-xs">
                      <span className="text-amber-400 font-bold">★ {r.rating}</span>
                      <span className="text-slate-300 font-medium">{r.total_deliveries} deliveries</span>
                      <span className="text-emerald-400 font-bold">৳{r.total_earnings} earned</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.is_online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {r.is_online ? 'Online' : 'Offline'}
                  </span>
                  <button
                    onClick={() => handleToggleRider(r.id, r.is_online)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-300"
                  >
                    Toggle {r.is_online ? 'Offline' : 'Online'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DATABASE TAB */}
        {activeTab === 'database' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-sky-400" />
                <div>
                  <h3 className="font-bold text-base text-white">Supabase Auto-Migration & Schema Engine</h3>
                  <p className="text-xs text-slate-400">Zero manual table creation required</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                stats?.dbStatus.usingPostgres
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {stats?.dbStatus.usingPostgres ? 'PostgreSQL / Supabase Connected' : 'In-Memory DB Active'}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Auto-Managed Database Tables</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(stats?.dbStatus.tablesCreated || ['restaurants', 'categories', 'food_items', 'riders', 'vendors', 'orders', 'system_logs']).map((table, i) => (
                  <div key={i} className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center space-x-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">{table}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KEEPALIVE TAB */}
        {activeTab === 'keepalive' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <Activity className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-bold text-base text-white">Render 24/7 Keep-Alive Monitor</h3>
                <p className="text-xs text-slate-400">Ping URL for UptimeRobot</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Ping Endpoint URL:</span>
                <button
                  onClick={copyPingUrl}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="bg-slate-900 px-3 py-2 rounded-xl font-mono text-xs text-emerald-400 border border-slate-800">
                {currentPingUrl}
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
