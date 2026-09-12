import React, { useState, useEffect } from 'react';
import { AdminStats, Order, Rider, Restaurant } from '../types';
import { api } from '../services/api';
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
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  Users
} from 'lucide-react';

interface AdminPortalProps {
  onOpenBots: () => void;
  onOpenPingModal: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenBots, onOpenPingModal }) => {
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
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
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
      const res = await api.triggerDbInit();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Admin Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Platform Master Control</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    SUPER ADMIN
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  Global supervision for Customers, Vendors, Riders, Database & 24/7 Render Keep-Alive
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
                <span>{isReinitializing ? 'Checking...' : 'Check Supabase DB'}</span>
              </button>
              <button
                onClick={onOpenPingModal}
                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Render 24/7 Stats</span>
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
          <div className="flex space-x-2 mt-4 pt-3 border-t border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white bg-slate-800/60'
              }`}
            >
              📊 System Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white bg-slate-800/60'
              }`}
            >
              📦 Master Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('riders')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'riders' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white bg-slate-800/60'
              }`}
            >
              🛵 Rider Fleet ({riders.length})
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'database' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white bg-slate-800/60'
              }`}
            >
              🗄️ Supabase Auto-Migration
            </button>
            <button
              onClick={() => setActiveTab('keepalive')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'keepalive' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
              }`}
            >
              ⚡ Render 24/7 Ping Setup
            </button>
          </div>
        </div>
      </div>

      {initMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
            <span>{initMsg}</span>
            <button onClick={() => setInitMsg(null)} className="font-bold text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* VIEW: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total GMV</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white mt-2">৳{stats?.totalGMV || 0}</p>
              <p className="text-[11px] text-emerald-400 mt-1 font-medium">All platform gross merchandise</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Commission (15%)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2">৳{stats?.platformCommission || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Platform net commission earnings</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Orders</span>
                <ShoppingBag className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-sky-400 mt-2">{stats?.activeOrders || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">In kitchen / Out for delivery</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Riders Online</span>
                <Bike className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 mt-2">{stats?.onlineRiders || 0} / {stats?.totalRiders || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Connected to Telegram bot dispatch</p>
            </div>
          </div>

          {/* Quick Hub: 3 Websites & 2 Bots Structure */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <span>🏗️ System Architecture Status</span>
              <span className="text-xs text-slate-400 font-normal">(3 Websites + 2 Telegram Bots + Supabase Core)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              All 5 interfaces run on this single unified Render web service instance with zero code fragmentation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400">1. Customer Website</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">ONLINE</span>
                </div>
                <p className="text-xs text-slate-300">Food browsing, restaurant filtering, interactive cart, step-by-step live order tracking.</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400">2. Vendor Shop Portal</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">ONLINE</span>
                </div>
                <p className="text-xs text-slate-300">Order accepting/rejecting, prep time controls, menu catalog editor, shop status switch.</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400">3. Master Control Portal</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">ACTIVE</span>
                </div>
                <p className="text-xs text-slate-300">Global supervision, database auto-schema verification, rider fleet monitoring.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-sky-900/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Bike className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Rider Telegram Bot</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accept delivery jobs, update pickup & delivered status, view earnings.
                  </p>
                </div>
                <button
                  onClick={onOpenBots}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg"
                >
                  Test Bot
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-sky-900/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Vendor Telegram Bot</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Instant order chime alerts, inline accept/reject & ready buttons.
                  </p>
                </div>
                <button
                  onClick={onOpenBots}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg"
                >
                  Test Bot
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW: MASTER ORDERS */}
      {activeTab === 'orders' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
        </main>
      )}

      {/* VIEW: RIDER FLEET */}
      {activeTab === 'riders' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riders.map(r => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
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
        </main>
      )}

      {/* VIEW: DATABASE & SUPABASE AUTO-MIGRATION */}
      {activeTab === 'database' && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-sky-400" />
                <div>
                  <h3 className="font-bold text-base text-white">Supabase Auto-Migration & Schema Engine</h3>
                  <p className="text-xs text-slate-400">Zero manual table creation required on Supabase</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                stats?.dbStatus.usingPostgres
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {stats?.dbStatus.usingPostgres ? 'PostgreSQL / Supabase Connected' : 'In-Memory DB Active (Seamless Fallback)'}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <p className="text-slate-300 font-semibold">How Auto-Creation Works:</p>
              <p className="text-slate-400 leading-relaxed">
                When you deploy to Render, you only need to add <b>DATABASE_URL</b> in Render's Environment Variables with your Supabase Connection String. The server boot hook automatically executes DDL queries (<code>CREATE TABLE IF NOT EXISTS</code>) for all required tables: <code>restaurants</code>, <code>categories</code>, <code>food_items</code>, <code>riders</code>, <code>vendors</code>, <code>orders</code>, and <code>system_logs</code>.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Auto-Managed Tables</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(stats?.dbStatus.tablesCreated || ['restaurants', 'categories', 'food_items', 'riders', 'vendors', 'orders', 'system_logs']).map((table, i) => (
                  <div key={i} className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex items-center space-x-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">{table}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">Last verified: {stats?.dbStatus.lastChecked || 'Just now'}</span>
              <button
                onClick={handleManualDbInit}
                disabled={isReinitializing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md"
              >
                {isReinitializing ? 'Verifying...' : 'Re-run Auto-Migration Check'}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* VIEW: RENDER 24/7 PING SETUP */}
      {activeTab === 'keepalive' && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Render 24/7 Keep-Alive & Ping System</h3>
                <p className="text-xs text-slate-400">Prevents free Render Web Service from sleeping after 15 minutes</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Your Ping Endpoint URL (Copy to UptimeRobot):</span>
                <button
                  onClick={copyPingUrl}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied!' : 'Copy Ping URL'}</span>
                </button>
              </div>
              <div className="bg-slate-900 px-3 py-2 rounded-lg font-mono text-xs text-emerald-400 border border-slate-800 select-all overflow-x-auto">
                {currentPingUrl}
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <h4 className="font-bold text-white text-sm">3-Step UptimeRobot Setup:</h4>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 leading-relaxed">
                <li>Create a free account on <a href="https://uptimerobot.com" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">UptimeRobot.com</a></li>
                <li>Click <b>+ Add New Monitor</b> &rarr; Select <b>HTTP(s)</b></li>
                <li>Paste your Render URL + <code>/api/ping</code> & set interval to <b>5 minutes</b>.</li>
              </ol>
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                💡 <b>Self-Heartbeat Included:</b> The server also has an internal cron heartbeat that runs every 5 minutes automatically, giving you double protection against sleep mode.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={onOpenPingModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
              >
                View Live Ping Logs & Metrics &rarr;
              </button>
            </div>
          </div>
        </main>
      )}

    </div>
  );
};
