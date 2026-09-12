import React, { useState, useEffect } from 'react';
import { PortalView, CartItem, Order } from './types';
import { Navbar } from './components/Navbar';
import { CustomerPortal } from './components/CustomerPortal';
import { VendorPortal } from './components/VendorPortal';
import { AdminPortal } from './components/AdminPortal';
import { TelegramBotSimulator } from './components/TelegramBotSimulator';
import { PingStatusModal } from './components/PingStatusModal';
import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState<PortalView>('customer');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPingModalOpen, setIsPingModalOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);

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
    const interval = setInterval(fetchGlobalState, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = orders.filter(o => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready').length;

  const handleOrderPlaced = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation & Portal Switcher Bar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        cartCount={totalCartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPingModal={() => setIsPingModalOpen(true)}
        isDbConnected={Boolean(dbStatus?.usingPostgres)}
        activeOrdersCount={activeOrdersCount}
      />

      {/* Render Selected Portal */}
      <main>
        {currentView === 'customer' && (
          <CustomerPortal
            onOpenBots={() => setCurrentView('telegram-bots')}
            onOpenVendor={() => setCurrentView('vendor')}
            cart={cart}
            setCart={setCart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            onOrderPlaced={handleOrderPlaced}
          />
        )}

        {currentView === 'vendor' && (
          <VendorPortal
            onOpenBots={() => setCurrentView('telegram-bots')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            onOpenBots={() => setCurrentView('telegram-bots')}
            onOpenPingModal={() => setIsPingModalOpen(true)}
          />
        )}

        {currentView === 'telegram-bots' && (
          <TelegramBotSimulator
            onOpenCustomer={() => setCurrentView('customer')}
            onOpenVendor={() => setCurrentView('vendor')}
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
