import React, { useState, useEffect, useRef } from 'react';
import { Restaurant, FoodItem, Order } from './types';
import { api } from './services/api';
import { 
  Store, 
  ShoppingBag, 
  UtensilsCrossed, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Bike, 
  Sparkles, 
  Check, 
  X,
  ChefHat,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Link
} from 'lucide-react';

export default function VendorApp() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [activeTab, setActiveTab] = useState<'live-orders' | 'menu-catalog' | 'shop-profile'>('live-orders');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<{ [orderId: string]: number }>({});
  
  // Menu Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemName, setItemName] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<string>('');
  const [itemCategory, setItemCategory] = useState<string>('Main Course');
  const [itemDesc, setItemDesc] = useState<string>('');
  const [itemImageUrl, setItemImageUrl] = useState<string>('');
  const [itemIsAvailable, setItemIsAvailable] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Supabase Storage File Upload States
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit');
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadError(null);
      setUploadedFileName(file.name);

      const result = await api.uploadImage(file);
      if (result && result.url) {
        setItemImageUrl(result.url);
        setUploadError(null);
      } else {
        throw new Error('No URL returned from Supabase storage');
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Failed to upload image to Supabase Storage');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [rests, ords] = await Promise.all([
        api.getRestaurants(),
        api.getOrders()
      ]);
      setRestaurants(rests);
      
      const currentRest = selectedRestaurant 
        ? rests.find(r => r.id === selectedRestaurant.id) || rests[0] 
        : rests[0];
      
      setSelectedRestaurant(currentRest);

      if (currentRest) {
        const foods = await api.getFoodItems(currentRest.id);
        setMenuItems(foods);
        setOrders(ords.filter(o => o.restaurant_id === currentRest.id));
      } else {
        setOrders(ords);
      }
    } catch (err) {
      console.error('Failed to load vendor data:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // Real-time polling from central Supabase DB
    const interval = setInterval(() => {
      loadData(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedRestaurant?.id]);

  const handleToggleShopStatus = async () => {
    if (!selectedRestaurant) return;
    try {
      const updated = await api.updateRestaurantStatus(selectedRestaurant.id, !selectedRestaurant.is_open);
      setSelectedRestaurant(updated);
      setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
      setActionMsg(`Shop is now ${updated.is_open ? '🟢 OPEN (Receiving orders)' : '🔴 CLOSED'}`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    const minutes = prepTimeMinutes[orderId] || 20;
    try {
      await api.updateOrderStatus(orderId, 'preparing', minutes);
      setActionMsg(`✅ Order #${orderId} accepted! Kitchen prep timer set to ${minutes} mins.`);
      setTimeout(() => setActionMsg(null), 4000);
      loadData(false);
    } catch (err: any) {
      alert(`Failed to accept order: ${err.message}`);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await api.updateOrderStatus(orderId, 'ready');
      setActionMsg(`🍲 Order #${orderId} marked READY! Rider telegram dispatch triggered.`);
      setTimeout(() => setActionMsg(null), 4000);
      loadData(false);
    } catch (err: any) {
      alert(`Failed to update order: ${err.message}`);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!window.confirm(`Reject Order #${orderId}? Customer will be notified.`)) return;
    try {
      await api.updateOrderStatus(orderId, 'cancelled');
      setActionMsg(`❌ Order #${orderId} rejected.`);
      setTimeout(() => setActionMsg(null), 4000);
      loadData(false);
    } catch (err: any) {
      alert(`Failed to reject order: ${err.message}`);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;

    try {
      const payload: Partial<FoodItem> = {
        name: itemName,
        price: parseFloat(itemPrice) || 0,
        category: itemCategory,
        description: itemDesc,
        image_url: itemImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        is_available: itemIsAvailable,
        restaurant_id: selectedRestaurant.id
      };

      if (editingItem) {
        await api.updateFoodItem(editingItem.id, payload);
        setActionMsg(`✅ Updated "${itemName}" in catalog.`);
      } else {
        await api.createFoodItem(payload);
        setActionMsg(`🎉 Added new dish "${itemName}" to menu! Visible in Customer App immediately.`);
      }

      setIsItemModalOpen(false);
      setEditingItem(null);
      setTimeout(() => setActionMsg(null), 4000);
      loadData(false);
    } catch (err: any) {
      alert(`Failed to save menu item: ${err.message}`);
    }
  };

  const handleToggleItemAvailability = async (item: FoodItem) => {
    try {
      await api.updateFoodItem(item.id, { is_available: !item.is_available });
      setMenuItems(prev => prev.map(f => f.id === item.id ? { ...f, is_available: !f.is_available } : f));
      setActionMsg(`Toggled ${item.name} to ${!item.is_available ? 'Available' : 'Sold Out'}`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(`Failed to update item: ${err.message}`);
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from your restaurant menu?`)) return;
    try {
      await api.deleteFoodItem(itemId);
      setMenuItems(prev => prev.filter(f => f.id !== itemId));
      setActionMsg(`🗑️ Deleted ${name} from catalog.`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(`Failed to delete item: ${err.message}`);
    }
  };

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setItemCategory('Main Course');
    setItemDesc('');
    setItemImageUrl('');
    setItemIsAvailable(true);
    setUploadError(null);
    setUploadedFileName(null);
    setShowUrlInput(false);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: FoodItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemCategory(item.category);
    setItemDesc(item.description);
    setItemImageUrl(item.image_url);
    setItemIsAvailable(item.is_available);
    setUploadError(null);
    setUploadedFileName(null);
    setShowUrlInput(false);
    setIsItemModalOpen(true);
  };

  const incomingOrders = orders.filter(o => o.status === 'placed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery');
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      
      {/* Standalone Vendor Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-white">{selectedRestaurant?.name || 'Vendor Portal'}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Vendor Partner
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Kitchen Operations & Live Menu Sync</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Restaurant Selector */}
            <select
              value={selectedRestaurant?.id || ''}
              onChange={(e) => {
                const found = restaurants.find(r => r.id === e.target.value);
                if (found) setSelectedRestaurant(found);
              }}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* Shop Open/Close Toggle */}
            {selectedRestaurant && (
              <button
                onClick={handleToggleShopStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedRestaurant.is_open
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                }`}
              >
                {selectedRestaurant.is_open ? '🟢 Kitchen Open' : '🔴 Kitchen Closed'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-2 py-2">
            <button
              onClick={() => setActiveTab('live-orders')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'live-orders' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              🍳 Live Kitchen Orders ({incomingOrders.length + preparingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('menu-catalog')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'menu-catalog' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              🍽️ Menu & Dish Catalog ({menuItems.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Banner notification */}
        {actionMsg && (
          <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-2xl flex items-center justify-between text-amber-300 text-xs">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* TAB 1: LIVE ORDERS BOARD */}
        {activeTab === 'live-orders' && (
          <div className="space-y-6">
            
            {/* Incoming New Orders Section */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                  <h2 className="text-base font-bold text-white">Incoming Orders Awaiting Approval ({incomingOrders.length})</h2>
                </div>
                <button
                  onClick={() => loadData(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {incomingOrders.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  No pending orders at this moment. New customer orders will ring here automatically!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-slate-950 border border-amber-500/40 rounded-2xl p-5 space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div>
                          <span className="font-bold text-sm text-white">Order #{order.id}</span>
                          <span className="text-[11px] text-slate-400 block">{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-sm font-black text-amber-400">৳{order.total}</span>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="text-slate-300 font-semibold">👤 {order.customer_name} ({order.customer_phone})</p>
                        <p className="text-slate-400">📍 {order.delivery_address}</p>
                        {order.notes && <p className="text-amber-300/80 bg-slate-900 p-2 rounded-lg">📝 Note: {order.notes}</p>}
                      </div>

                      {/* Items */}
                      <div className="p-3 bg-slate-900 rounded-xl space-y-1.5 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Ordered Items:</span>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-200">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="text-slate-400">৳{it.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Accept Controls */}
                      <div className="pt-2 flex items-center space-x-2">
                        <select
                          value={prepTimeMinutes[order.id] || 20}
                          onChange={(e) => setPrepTimeMinutes({ ...prepTimeMinutes, [order.id]: parseInt(e.target.value) })}
                          className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-2"
                        >
                          <option value={15}>15 mins</option>
                          <option value={20}>20 mins</option>
                          <option value={30}>30 mins</option>
                          <option value={45}>45 mins</option>
                        </select>

                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept & Cook</span>
                        </button>

                        <button
                          onClick={() => handleRejectOrder(order.id)}
                          className="px-3 py-2 bg-slate-900 hover:bg-rose-950 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* In Cooking / Preparing Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ChefHat className="w-5 h-5 text-sky-400" />
                <span>Currently Cooking in Kitchen ({preparingOrders.length})</span>
              </h2>

              {preparingOrders.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No orders currently in preparation.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preparingOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-slate-950 border border-sky-500/30 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="font-bold text-sm text-white">Order #{order.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase">
                          Cooking
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-300">
                        <p>👤 {order.customer_name} • ৳{order.total}</p>
                        <div className="p-2 bg-slate-900 rounded-xl space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{it.quantity}x {it.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleMarkReady(order.id)}
                        className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Food Ready & Call Rider Dispatch</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Handed Over / Completed Orders */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white">Dispatched & Delivered ({readyOrders.length + completedOrders.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Rider</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[...readyOrders, ...completedOrders].map(o => (
                      <tr key={o.id} className="hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-bold text-white">#{o.id}</td>
                        <td className="py-2.5 px-3 text-slate-300">{o.customer_name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-400">৳{o.total}</td>
                        <td className="py-2.5 px-3 text-sky-400">{o.rider_name || 'Assigned via Bot'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MENU & DISH CATALOG */}
        {activeTab === 'menu-catalog' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Dish Catalog for {selectedRestaurant?.name}</h2>
                <p className="text-xs text-slate-400">Changes reflect instantly in the Customer Website via the shared Supabase DB.</p>
              </div>
              <button
                onClick={openAddItemModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-2xl flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-36 w-full rounded-2xl bg-slate-800 overflow-hidden relative">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] font-bold text-amber-300">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-white">{item.name}</h3>
                      <span className="text-sm font-black text-amber-400">৳{item.price}</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleItemAvailability(item)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        item.is_available
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditItemModal(item)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Add / Edit Dish Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingItem ? `Edit "${editingItem.name}"` : 'Add New Dish to Menu'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Chicken Biryani"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Price (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    placeholder="350"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Biryani">Biryani</option>
                    <option value="Burgers">Burgers</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Dish Photo (Supabase Storage)</label>
                
                {/* File Picker & Drag-and-Drop Area */}
                <div className="space-y-2">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      if (!isUploadingImage) {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                      isDragging
                        ? 'border-amber-500 bg-amber-500/10'
                        : itemImageUrl
                        ? 'border-emerald-500/50 bg-slate-950/70 hover:border-emerald-400'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />

                    {isUploadingImage ? (
                      <div className="py-3 flex flex-col items-center space-y-2">
                        <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                        <div className="text-xs font-bold text-amber-300">
                          Uploading to Supabase Storage bucket...
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Bucket: food-delivery-assets
                        </span>
                      </div>
                    ) : itemImageUrl ? (
                      <div className="w-full flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 text-left">
                          <img
                            src={itemImageUrl}
                            alt="Dish Preview"
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover border border-emerald-500/40 shadow-sm"
                            onError={(e) => {
                              (e.target as any).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div>
                            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Uploaded to Supabase Storage</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                              {uploadedFileName || 'Public image URL linked'}
                            </p>
                            <span className="text-[10px] text-amber-400 hover:underline">
                              Click to change image
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemImageUrl('');
                            setUploadedFileName(null);
                          }}
                          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 flex flex-col items-center space-y-1.5">
                        <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shadow-inner">
                          <UploadCloud className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-slate-300">
                          <span className="font-bold text-amber-400">Click to choose image</span> or drag & drop
                        </div>
                        <p className="text-[10px] text-slate-500">
                          PNG, JPG, WEBP • Auto-uploads to Supabase Storage bucket
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Fallback Option */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-slate-400 hover:text-amber-400 flex items-center space-x-1 underline decoration-dotted"
                    >
                      <Link className="w-3 h-3" />
                      <span>{showUrlInput ? 'Hide manual image URL' : 'Or paste image URL manually'}</span>
                    </button>
                  </div>

                  {showUrlInput && (
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={itemImageUrl}
                      onChange={(e) => setItemImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Delicious spiced rice with tender chicken piece..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="avail-check"
                  checked={itemIsAvailable}
                  onChange={(e) => setItemIsAvailable(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500"
                />
                <label htmlFor="avail-check" className="text-slate-300 font-semibold cursor-pointer">
                  Available in kitchen today
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {editingItem ? 'Save Changes' : 'Publish Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
