import React from 'react';
import { PortalView } from '../types';
import { 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  Bot, 
  Activity, 
  Database,
  Radio
} from 'lucide-react';

interface NavbarProps {
  currentView: PortalView;
  onViewChange: (view: PortalView) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenPingModal: () => void;
  isDbConnected: boolean;
  activeOrdersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  cartCount,
  onOpenCart,
  onOpenPingModal,
  isDbConnected,
  activeOrdersCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onViewChange('customer')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20">
              🍔
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">FoodFlow</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Full System
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Websites + Telegram Bots + Supabase Core</p>
            </div>
          </div>

          {/* Portal Switcher Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="nav-customer-btn"
              onClick={() => onViewChange('customer')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'customer'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Customer Website</span>
            </button>

            <button
              id="nav-vendor-btn"
              onClick={() => onViewChange('vendor')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                currentView === 'vendor'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vendor Shop Manager</span>
              {activeOrdersCount > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>

            <button
              id="nav-admin-btn"
              onClick={() => onViewChange('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Master Admin</span>
            </button>

            <button
              id="nav-bots-btn"
              onClick={() => onViewChange('telegram-bots')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'telegram-bots'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-sky-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Telegram Bots (Rider + Vendor)</span>
            </button>
          </nav>

          {/* Right Status Actions */}
          <div className="flex items-center space-x-2.5">
            {/* 24/7 Render Keep-Alive Pill */}
            <button
              id="keepalive-status-btn"
              onClick={onOpenPingModal}
              title="Click to view 24/7 Render Keep-Alive Monitor & UptimeRobot setup"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline font-mono font-medium">Render 24/7 Active</span>
              <Activity className="w-3 h-3 text-emerald-400" />
            </button>

            {/* Cart Button (Customer View) */}
            {currentView === 'customer' && (
              <button
                id="cart-toggle-btn"
                onClick={onOpenCart}
                className="relative flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="bg-slate-950 text-white text-[11px] px-1.5 py-0.2 rounded-full font-extrabold min-w-[18px] text-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Selector */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-800 no-scrollbar">
          <button
            onClick={() => onViewChange('customer')}
            className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap font-medium ${
              currentView === 'customer' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Customer Web
          </button>
          <button
            onClick={() => onViewChange('vendor')}
            className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap font-medium ${
              currentView === 'vendor' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Vendor Web
          </button>
          <button
            onClick={() => onViewChange('admin')}
            className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap font-medium ${
              currentView === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Master Admin
          </button>
          <button
            onClick={() => onViewChange('telegram-bots')}
            className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap font-medium ${
              currentView === 'telegram-bots' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-sky-300'
            }`}
          >
            Telegram Bots
          </button>
        </div>
      </div>
    </header>
  );
};
