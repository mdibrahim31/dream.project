import React, { useState, useEffect } from 'react';
import { Restaurant, FoodItem, Order, Category } from '../types';
import { api } from '../services/api';
import { 
  Store, 
  ChefHat, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Bell, 
  DollarSign, 
  ShoppingBag, 
  Check, 
  X,
  RefreshCw,
  Power
} from 'lucide-react';

interface VendorPortalProps {
  onOpenBots: () => void;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({ onOpenBots }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'stats'>('orders');
  const [orderFilter, setOrderFilter] = useState<'active' | 'all'>('active');

  // New Food Item Form
  const [isAddingFood, setIsAddingFood] = useState<boolean>(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: 250,
    category: 'Biryani & Rice',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: false
  });

  const loadData = async () => {
    try {
      const [resList, catList] = await Promise.all([
        api.getRestaurants(),
        api.getCategories()
      ]);
      setRestaurants(resList);
      setCategories(catList);

      const target = selectedRestaurant || resList[0];
      if (target) {
        setSelectedRestaurant(target);
        const [menuList, ordersList] = await Promise.all([
          api.getFoodItems(target.id),
          api.getOrders({ restaurant_id: target.id })
        ]);
        setFoodItems(menuList);
        setOrders(ordersList);
      }
    } catch (err) {
      console.error('Vendor data load err:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      if (selectedRestaurant) {
        try {
          const ords = await api.getOrders({ restaurant_id: selectedRestaurant.id });
          setOrders(ords);
        } catch (e) {}
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedRestaurant?.id]);

  const handleRestaurantSwitch = async (r: Restaurant) => {
    setSelectedRestaurant(r);
    const [menuList, ordersList] = await Promise.all([
      api.getFoodItems(r.id),
      api.getOrders({ restaurant_id: r.id })
    ]);
    setFoodItems(menuList);
    setOrders(ordersList);
  };

  const handleToggleShopStatus = async () => {
    if (!selectedRestaurant) return;
    try {
      const updated = await api.updateRestaurant(selectedRestaurant.id, {
        is_open: !selectedRestaurant.is_open
      });
      setSelectedRestaurant(updated);
      setRestaurants(restaurants.map(r => r.id === updated.id ? updated : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await api.updateOrderStatus(orderId, status);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;

    try {
      if (editingFood) {
        await api.updateFoodItem(editingFood.id, foodForm);
      } else {
        await api.createFoodItem({
          ...foodForm,
          restaurant_id: selectedRestaurant.id
        });
      }
      setIsAddingFood(false);
      setEditingFood(null);
      setFoodForm({
        name: '',
        description: '',
        price: 250,
        category: categories[1]?.name || 'Biryani & Rice',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        is_available: true,
        is_popular: false
      });
      const items = await api.getFoodItems(selectedRestaurant.id);
      setFoodItems(items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu dish?')) return;
    try {
      await api.deleteFoodItem(id);
      if (selectedRestaurant) {
        const items = await api.getFoodItems(selectedRestaurant.id);
        setFoodItems(items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeKitchenOrders = orders.filter(o => o.status === 'placed' || o.status === 'accepted' || o.status === 'preparing');
  const readyAndDispatched = orders.filter(o => o.status === 'ready' || o.status === 'picked_up' || o.status === 'out_for_delivery');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Vendor Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Restaurant Selector & Status */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <select
                    id="vendor-restaurant-select"
                    value={selectedRestaurant?.id || ''}
                    onChange={(e) => {
                      const r = restaurants.find(item => item.id === e.target.value);
                      if (r) handleRestaurantSwitch(r);
                    }}
                    className="bg-slate-950 border border-slate-700 text-white font-bold text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
                  >
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleToggleShopStatus}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedRestaurant?.is_open
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{selectedRestaurant?.is_open ? 'Kitchen OPEN' : 'Kitchen CLOSED'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Telegram Bot notifications active for this shop
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Live Orders</span>
                <span className="text-sm font-black text-amber-400">{activeKitchenOrders.length} Pending</span>
              </div>
              <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Sales</span>
                <span className="text-sm font-black text-emerald-400">৳{totalSales}</span>
              </div>
              <button
                onClick={onOpenBots}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Vendor Bot</span>
              </button>
            </div>

          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white bg-slate-800/60'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'menu'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Menu Items ({foodItems.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: KITCHEN ORDERS */}
      {activeTab === 'orders' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Live Kitchen Order Board</span>
              <span className="text-xs font-normal text-slate-400">
                (Incoming orders from Web & Vendor Telegram Bot)
              </span>
            </h2>
            <button
              onClick={loadData}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
              <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No orders for this restaurant yet</p>
              <p className="text-xs text-slate-500 mt-1">Switch to the Customer website tab to place a test order!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((ord) => {
                const isNew = ord.status === 'placed';
                const isPrep = ord.status === 'preparing' || ord.status === 'accepted';
                const isReady = ord.status === 'ready';
                const isDone = ord.status === 'delivered';

                return (
                  <div
                    key={ord.id}
                    id={`vendor-order-${ord.id}`}
                    className={`bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between shadow-md transition-all ${
                      isNew
                        ? 'border-amber-500 ring-2 ring-amber-500/30'
                        : isPrep
                        ? 'border-sky-500/60'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Order Header */}
                      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-white text-base">#{ord.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isNew
                                ? 'bg-amber-500 text-slate-950 animate-bounce'
                                : isPrep
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : isReady
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : isDone
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Customer: <b className="text-white">{ord.customer_name}</b> ({ord.customer_phone})
                          </span>
                        </div>
                        <span className="text-xs font-black text-amber-400">৳{ord.total}</span>
                      </div>

                      {/* Items List */}
                      <div className="py-3 space-y-2 text-xs">
                        {ord.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-start">
                            <span className="text-slate-200">
                              <b className="text-amber-400">{item.quantity}x</b> {item.name}
                              {item.instructions && (
                                <span className="block text-[10px] text-amber-300/80 italic">Note: {item.instructions}</span>
                              )}
                            </span>
                            <span className="text-slate-400 font-medium">৳{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Notes & Delivery Address */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 mb-4 space-y-1">
                        <div><b>Address:</b> {ord.delivery_address}</div>
                        {ord.notes && <div><b>Instructions:</b> <span className="text-amber-300 italic">{ord.notes}</span></div>}
                        {ord.rider_name && (
                          <div className="text-sky-400">
                            <b>Rider Assigned:</b> {ord.rider_name} ({ord.rider_phone})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      {isNew && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md"
                          >
                            ✅ Accept & Cook
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                            className="w-full py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-xl text-xs font-bold"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}

                      {isPrep && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'ready')}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-1.5"
                        >
                          <span>🍲 Mark Ready for Rider Pickup</span>
                        </button>
                      )}

                      {isReady && (
                        <div className="text-center py-1.5 text-xs text-purple-300 bg-purple-950/40 rounded-lg border border-purple-800/50">
                          Waiting for Rider #{ord.rider_name || 'Fleet'} to Pick Up
                        </div>
                      )}

                      {ord.status === 'out_for_delivery' && (
                        <div className="text-center py-1.5 text-xs text-sky-300 bg-sky-950/40 rounded-lg border border-sky-800/50">
                          🛵 Out for Delivery by {ord.rider_name || 'Rider'}
                        </div>
                      )}

                      {isDone && (
                        <div className="text-center py-1.5 text-xs text-emerald-400 bg-emerald-950/40 rounded-lg border border-emerald-800/50">
                          ✓ Successfully Delivered & Completed
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* VIEW: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Menu & Dish Catalog</h2>
              <p className="text-xs text-slate-400">Manage foods, prices, ingredients & availability for {selectedRestaurant?.name}</p>
            </div>
            <button
              onClick={() => {
                setEditingFood(null);
                setFoodForm({
                  name: '',
                  description: '',
                  price: 300,
                  category: categories[1]?.name || 'Biryani & Rice',
                  image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
                  is_available: true,
                  is_popular: false
                });
                setIsAddingFood(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          {/* Dishes Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Dish</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {foodItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <span className="font-bold text-white block text-sm">{item.name}</span>
                            <span className="text-slate-400 text-[11px] line-clamp-1">{item.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-400 text-sm">
                        ৳{item.price}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            await api.updateFoodItem(item.id, { is_available: !item.is_available });
                            loadData();
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.is_available
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {item.is_available ? 'Available' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingFood(item);
                            setFoodForm({
                              name: item.name,
                              description: item.description,
                              price: item.price,
                              category: item.category,
                              image_url: item.image_url,
                              is_available: item.is_available,
                              is_popular: Boolean(item.is_popular)
                            });
                            setIsAddingFood(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFood(item.id)}
                          className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ADD / EDIT FOOD MODAL */}
      {isAddingFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingFood ? 'Edit Dish' : 'Add New Dish to Menu'}
              </h3>
              <button onClick={() => setIsAddingFood(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  placeholder="e.g., Mutton Kacchi Biryani"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Price (৳)</label>
                  <input
                    type="number"
                    required
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={foodForm.category}
                    onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {categories.filter(c => c.name !== 'All').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  placeholder="Fresh ingredients, spices and cooking method..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Food Image URL</label>
                <input
                  type="url"
                  required
                  value={foodForm.image_url}
                  onChange={(e) => setFoodForm({ ...foodForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foodForm.is_available}
                    onChange={(e) => setFoodForm({ ...foodForm, is_available: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500"
                  />
                  <span>Available in Kitchen</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foodForm.is_popular}
                    onChange={(e) => setFoodForm({ ...foodForm, is_popular: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500"
                  />
                  <span>Featured / Popular</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingFood(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md"
                >
                  {editingFood ? 'Save Changes' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
