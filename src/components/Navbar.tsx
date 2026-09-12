import React, { useState } from 'react';
import { PortalView } from '../types';
import { 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  Bot, 
  Activity, 
  Database,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Globe
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

const SITES_CONFIG: {
  id: PortalView;
  name: string;
  shortName: string;
  path: string;
  icon: any;
  badge?: string;
  color: string;
}[] = [
  {
    id: 'customer',
    name: 'Customer Food Website',
    shortName: 'Customer Web',
    path: '/',
    icon: ShoppingBag,
    color: 'amber'
  },
  {
    id: 'vendor',
    name: 'Vendor Kitchen Manager',
    shortName: 'Vendor Web',
    path: '/vendor',
    icon: Store,
    color: 'emerald'
  },
  {
    id: 'admin',
    name: 'Platform Super Admin',
    shortName: 'Admin Web',
    path: '/admin',
    icon: ShieldCheck,
    color: 'purple'
  },
  {
    id: 'telegram-bots',
    name: 'Telegram Bots Dispatch',
    shortName: 'Telegram Bots',
    path: '/bots',
    icon: Bot,
    color: 'sky'
  }
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  cartCount,
  onOpenCart,
  onOpenPingModal,
  isDbConnected,
  activeOrdersCount
}) => {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopyUrl = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleOpenNewTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${path}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      
      {/* Top Banner: Standalone Websites Directory */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-300">Multi-Website Core System:</span>
            <span className="text-slate-500 hidden sm:inline">3 Dedicated Websites + 2 Telegram Bots sharing 1 Database</span>
          </div>

          {/* Quick Standalone URLs */}
          <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-0.5">
            {SITES_CONFIG.map((site) => {
              const isCurrent = currentView === site.id;
              return (
                <div
                  key={site.id}
                  className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-md transition-all ${
                    isCurrent
                      ? 'bg-slate-800 text-amber-400 border border-amber-500/40 font-bold'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <button
                    onClick={() => onViewChange(site.id)}
                    className="flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{site.shortName}</span>
                    <span className="font-mono text-[10px] text-slate-500">({site.path})</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenNewTab(site.path, e)}
                    title={`Open ${site.name} in separate browser tab`}
                    className="text-slate-500 hover:text-white p-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleCopyUrl(site.path, e)}
                    title={`Copy direct URL for ${site.shortName}`}
                    className="text-slate-500 hover:text-amber-400 p-0.5"
                  >
                    {copiedPath === site.path ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onViewChange('customer')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-500/20">
              🍔
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">FoodFlow</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentView === 'customer' ? 'Customer Website' : currentView === 'vendor' ? 'Vendor Portal' : currentView === 'admin' ? 'Master Admin' : 'Telegram Bots Hub'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Connected to Unified Supabase Database</p>
            </div>
          </div>

          {/* Portal Switcher Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="nav-customer-btn"
              onClick={() => onViewChange('customer')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
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
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
