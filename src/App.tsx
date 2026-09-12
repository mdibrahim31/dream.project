import React, { useState, useEffect } from 'react';
import { PortalView, CartItem, Order } from './types';
import { Navbar } from './components/Navbar';
import { CustomerPortal } from './components/CustomerPortal';
import { VendorPortal } from './components/VendorPortal';
import { AdminPortal } from './components/AdminPortal';
import { TelegramBotSimulator } from './components/TelegramBotSimulator';
import { PingStatusModal } from './components/PingStatusModal';
import { api } from './services/api';

// Helper to determine view from URL path
function getViewFromPath(pathname: string): PortalView {
  const path = pathname.toLowerCase();
  if (path.startsWith('/vendor')) return 'vendor';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/bots') || path.startsWith('/telegram')) return 'telegram-bots';
  return 'customer';
}

function getPathFromView(view: PortalView): string {
  switch (view) {
    case 'vendor': return '/vendor';
    case 'admin': return '/admin';
    case 'telegram-bots': return '/bots';
    case 'customer':
    default: return '/';
  }
}

function getPageTitle(view: PortalView): string {
  switch (view) {
    case 'vendor': return 'FoodFlow Partner | Vendor Kitchen Portal';
    case 'admin': return 'FoodFlow Master | Platform Super Admin';
    case 'telegram-bots': return 'FoodFlow Bots | Telegram Dispatch Network';
    case 'customer':
    default: return 'FoodFlow | Online Food Delivery';
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<PortalView>(() => {
    if (typeof window !== 'undefined') {
      return getViewFromPath(window.location.pathname);
    }
    return 'customer';
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPingModalOpen, setIsPingModalOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Sync view with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const view = getViewFromPath(window.location.pathname);
      setCurrentView(view);
      document.title = getPageTitle(view);
    };

    window.addEventListener('popstate', handlePopState);
    document.title = getPageTitle(currentView);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handler to switch view and update browser URL
  const handleViewChange = (newView: PortalView) => {
    setCurrentView(newView);
    const newPath = getPathFromView(newView);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    document.title = getPageTitle(newView);
  };

  const fetchGlobalState = async () => {
    try {
      const [ords, dbStat] = await Promise.all([
        api.getOrders(),
        api.getAdminStats()
      ]);
      setOrders(ords);
      setDbStatus(dbStat.dbStatus);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    fetchGlobalState();
    const interval = setInterval(fetchGlobalState, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = orders.filter(o => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready').length;

  const handleOrderPlaced = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Universal Website Switcher & Multi-Website Hub Bar */}
      <Navbar
        currentView={currentView}
        onViewChange={handleViewChange}
        cartCount={totalCartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPingModal={() => setIsPingModalOpen(true)}
        isDbConnected={Boolean(dbStatus?.usingPostgres)}
        activeOrdersCount={activeOrdersCount}
      />

      {/* Render Selected Portal Website */}
      <main>
        {currentView === 'customer' && (
          <CustomerPortal
            onOpenBots={() => handleViewChange('telegram-bots')}
            onOpenVendor={() => handleViewChange('vendor')}
            cart={cart}
            setCart={setCart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            onOrderPlaced={handleOrderPlaced}
          />
        )}

        {currentView === 'vendor' && (
          <VendorPortal
            onOpenBots={() => handleViewChange('telegram-bots')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            onOpenBots={() => handleViewChange('telegram-bots')}
            onOpenPingModal={() => setIsPingModalOpen(true)}
          />
        )}

        {currentView === 'telegram-bots' && (
          <TelegramBotSimulator
            onOpenCustomer={() => handleViewChange('customer')}
            onOpenVendor={() => handleViewChange('vendor')}
          />
        )}
      </main>

      {/* 24/7 Render Keep-Alive Modal */}
      <PingStatusModal
        isOpen={isPingModalOpen}
        onClose={() => setIsPingModalOpen(false)}
      />

    </div>
  );
}
