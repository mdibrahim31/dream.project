import React, { useState, useEffect } from 'react';
import { 
  Utensils, ShoppingBag, Store, ShieldAlert, Bot, Search, Plus, Trash2, 
  CheckCircle2, Clock, MapPin, Phone, DollarSign, Send, RefreshCw, X, Check,
  ChevronRight, ArrowRight, Settings, Image as ImageIcon, Flame
} from 'lucide-react';
import { api } from './services/api';
import { Restaurant, Category, FoodItem, Order, BotMessage } from './types';

export default function App() {
  const [activePortal, setActivePortal] = useState<'customer' | 'vendor' | 'admin' | 'bots'>('customer');
  const [backendUrl, setBackendUrl] = useState<string>(() => localStorage.getItem('foodflow_backend_url') || '');
  const [showSettings, setShowSettings] = useState(false);

  // Data states
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer specific states
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ item: FoodItem; quantity: number }[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('Rahim Ahmed');
  const [customerPhone, setCustomerPhone] = useState('+8801811223344');
  const [customerAddress, setCustomerAddress] = useState('House 42, Road 11, Banani, Dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash'>('cod');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Vendor specific states
  const [showAddDish, setShowAddDish] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Biryani');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newVendorName, setNewVendorName] = useState("Sultans Dine Kitchen");
  const [newDishImage, setNewDishImage] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Telegram Simulator states
  const [botTab, setBotTab] = useState<'vendor' | 'rider'>('vendor');
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [botInput, setBotInput] = useState('');

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 5000); // Poll for live sync across portals
    return () => clearInterval(interval);
  }, []);

  async function loadAllData() {
    try {
      const [rests, cats, items, ords] = await Promise.all([
        api.getRestaurants(),
        api.getCategories(),
        api.getFoodItems(),
        api.getOrders()
      ]);
      setRestaurants(rests);
      if (rests.length > 0 && !selectedRest) setSelectedRest(rests[0]);
      setCategories(cats);
      setFoodItems(items);
      setOrders(ords);

      // Load bot messages
      const msgs = await api.getBotMessages(botTab, botTab === 'vendor' ? 'vendor-1' : 'rider-1');
      setBotMessages(msgs);
    } catch (e) {
      console.error('Data load error:', e);
    } finally {
      setLoading(false);
    }
  }

  // Save backend URL
  const handleSaveBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('foodflow_backend_url', backendUrl);
    setShowSettings(false);
    loadAllData();
    alert('Backend URL updated successfully! All portals are now connected to the central server.');
  };

  // Customer Actions
  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.item.id === id) {
        const nq = c.quantity + delta;
        return nq > 0 ? { ...c, quantity: nq } : null;
      }
      return c;
    }).filter(Boolean) as any);
  };

  const cartSubtotal = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const deliveryFee = selectedRest?.delivery_fee || 50;
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee : 0;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      const orderPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: customerAddress,
        restaurant_id: selectedRest?.id || 'rest-1',
        restaurant_name: selectedRest?.name || "Sultans Dine",
        items: cart.map(c => ({ id: c.item.id, name: c.item.name, price: c.item.price, quantity: c.quantity, image_url: c.item.image_url })),
        subtotal: cartSubtotal,
        delivery_fee: deliveryFee,
        total: cartTotal,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'bkash' ? 'paid' : 'pending'
      };

      const newOrder = await api.createOrder(orderPayload);
      setActiveOrder(newOrder);
      setCart([]);
      setShowCheckout(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    }
  };

  // Vendor Actions
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    setUploadError('');
    try {
      const res = await api.uploadImage(file);
      setNewDishImage(res.url);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image to Supabase Storage');
    } finally {
      setUploadingImg(false);
    }
  };

  const handlePublishDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName || !newDishPrice) {
      alert('Please fill in dish name and price');
      return;
    }

    try {
      await api.createFoodItem({
        restaurant_id: selectedRest?.id || 'rest-1',
        restaurant_name: selectedRest?.name || "Sultans Dine",
        vendor_name: newVendorName,
        name: newDishName,
        price: parseFloat(newDishPrice),
        category: newDishCategory,
        description: newDishDesc,
        image_url: newDishImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        is_available: true,
        is_popular: true
      });

      setNewDishName('');
      setNewDishPrice('');
      setNewDishDesc('');
      setNewDishImage('');
      setShowAddDish(false);
      loadAllData();
      alert('🎉 Dish published successfully to Supabase Database and synced across all portals!');
    } catch (err: any) {
      alert(err.message || 'Failed to publish dish');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status'], prepMinutes = 20) => {
    try {
      await api.updateOrderStatus(orderId, status, prepMinutes);
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Telegram Bot Simulator Send
  const handleSendBotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim()) return;
    const text = botInput;
    setBotInput('');
    const chatId = botTab === 'vendor' ? 'vendor-1' : 'rider-1';
    const res = await api.sendBotMessage(botTab, chatId, text);
    if (res.messages) setBotMessages(res.messages);
  };

  const handleBotCommandClick = async (cmd: string) => {
    const chatId = botTab === 'vendor' ? 'vendor-1' : 'rider-1';
    const res = await api.sendBotMessage(botTab, chatId, cmd);
    if (res.messages) setBotMessages(res.messages);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Utensils className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center space-x-2">
                <span>FoodFlow</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">Central Pipeline</span>
              </h1>
              <p className="text-xs text-slate-400">Unified Customer, Vendor & Telegram Bot Ecosystem</p>
            </div>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
            <button
              onClick={() => setActivePortal('customer')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePortal === 'customer' 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Customer App</span>
            </button>

            <button
              onClick={() => setActivePortal('vendor')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePortal === 'vendor' 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vendor Kitchen</span>
            </button>

            <button
              onClick={() => setActivePortal('bots')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePortal === 'bots' 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Telegram Bots</span>
            </button>

            <button
              onClick={() => setActivePortal('admin')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePortal === 'admin' 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Center</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
              title="Configure Backend URL"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Config Backend</span>
            </button>
            <div className="flex items-center space-x-1.5 bg-emerald-950/50 border border-emerald-800/50 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Sync</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Connecting to Central Database & Loading Ecosystem...</p>
          </div>
        ) : (
          <>
            {/* ================= CUSTOMER PORTAL ================= */}
            {activePortal === 'customer' && (
              <div className="space-y-6">
                {/* Hero Banner */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 p-6 md:p-10 shadow-2xl">
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
                  <div className="relative z-10 max-w-2xl space-y-4">
                    <span className="bg-slate-950/40 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center space-x-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>FASTEST 30-MIN DELIVERY IN DHAKA</span>
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                      Craving Delicious Food? We Deliver Hot & Fresh.
                    </h2>
                    <p className="text-amber-100 text-sm md:text-base font-medium">
                      Freshly cooked in verified vendor kitchens and dispatched instantly via automated Telegram logistics.
                    </p>
                    <div className="flex items-center bg-slate-950/80 backdrop-blur-md rounded-2xl p-2 border border-white/10 max-w-md shadow-xl">
                      <Search className="w-5 h-5 text-amber-400 ml-2" />
                      <input
                        type="text"
                        placeholder="Search biryani, kacchi, burgers..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none px-3 py-2 text-white placeholder-slate-400 focus:outline-none w-full text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                        selectedCategory === cat.name
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Restaurants & Menu Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span>Partner Kitchen Menus (Synced Live)</span>
                      </h3>
                      <span className="text-xs text-slate-400">{foodItems.length} items available</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {foodItems
                        .filter(f => selectedCategory === 'All' || f.category === selectedCategory)
                        .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(item => (
                          <div key={item.id} className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all shadow-lg flex flex-col justify-between group">
                            <div className="relative h-48 overflow-hidden">
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-amber-400">
                                ৳{item.price}
                              </div>
                              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-semibold text-slate-300">
                                🏪 {item.restaurant_name}
                              </div>
                            </div>
                            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-white text-base">{item.name}</h4>
                                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                <span className="text-[11px] text-emerald-400 font-medium">✓ Available in Kitchen</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                  + Add to Cart
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Cart & Checkout Sidebar */}
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-20">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <h3 className="font-bold text-white text-base flex items-center space-x-2">
                          <ShoppingBag className="w-4 h-4 text-amber-400" />
                          <span>Your Order Cart</span>
                        </h3>
                        <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-bold">{cart.length} items</span>
                      </div>

                      {cart.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <p className="text-slate-400 text-xs font-medium">Your cart is currently empty. Add dishes from the kitchen menu!</p>
                        </div>
                      ) : (
                        <div className="py-4 space-y-3 divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                          {cart.map(c => (
                            <div key={c.item.id} className="pt-3 first:pt-0 flex items-center justify-between">
                              <div>
                                <h5 className="text-xs font-bold text-white">{c.item.name}</h5>
                                <p className="text-[11px] text-amber-400 font-semibold">৳{c.item.price} x {c.quantity}</p>
                              </div>
                              <div className="flex items-center space-x-2 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                                <button onClick={() => updateCartQty(c.item.id, -1)} className="text-slate-400 hover:text-white px-1">-</button>
                                <span className="text-xs font-bold text-white">{c.quantity}</span>
                                <button onClick={() => updateCartQty(c.item.id, 1)} className="text-slate-400 hover:text-white px-1">+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {cart.length > 0 && (
                        <div className="pt-4 border-t border-slate-800 space-y-3">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Subtotal</span>
                            <span className="font-bold text-white">৳{cartSubtotal}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Delivery Fee</span>
                            <span className="font-bold text-white">৳{deliveryFee}</span>
                          </div>
                          <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                            <span>Total Payable</span>
                            <span className="text-amber-400 text-base">৳{cartTotal}</span>
                          </div>
                          <button
                            onClick={() => setShowCheckout(true)}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition-all mt-2"
                          >
                            Proceed to Checkout 🚀
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= VENDOR PORTAL ================= */}
            {activePortal === 'vendor' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  <div>
                    <span className="text-xs text-amber-400 font-bold">VENDOR KITCHEN DASHBOARD</span>
                    <h2 className="text-2xl font-black text-white mt-1">Sultans Dine Kitchen Management</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Manage live menu dishes, upload to Supabase storage, and accept incoming orders.</p>
                  </div>
                  <button
                    onClick={() => setShowAddDish(true)}
                    className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/25 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Dish to Menu</span>
                  </button>
                </div>

                {/* Active Orders for Vendor */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>Incoming Customer Orders</span>
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-bold">{orders.length}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.map(ord => (
                      <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div>
                            <span className="text-xs font-bold text-amber-400">Order #{ord.id}</span>
                            <h4 className="font-bold text-white text-sm mt-0.5">{ord.customer_name} ({ord.customer_phone})</h4>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                            ord.status === 'placed' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            ord.status === 'preparing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {ord.status}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-slate-400">📍 {ord.delivery_address}</p>
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                            {ord.items?.map((i: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-slate-300">{i.quantity}x {i.name}</span>
                                <span className="text-amber-400">৳{i.price * i.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-black text-white">Total: ৳{ord.total}</span>
                          <div className="flex items-center space-x-2">
                            {ord.status === 'placed' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'preparing', 20)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                              >
                                Accept (20m)
                              </button>
                            )}
                            {ord.status === 'preparing' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'out_for_delivery')}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20"
                              >
                                Send to Rider Bot 🛵
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TELEGRAM BOTS SIMULATOR ================= */}
            {activePortal === 'bots' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-amber-400 font-bold">AUTOMATED TELEGRAM LOGISTICS</span>
                    <h2 className="text-2xl font-black text-white mt-1">Telegram Bot Simulator & Webhook Testing</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Test rider and vendor bot interactions, command responses, and automated order dispatching.</p>
                  </div>
                  <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    <button
                      onClick={() => setBotTab('vendor')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${botTab === 'vendor' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      👨‍🍳 Vendor Kitchen Bot
                    </button>
                    <button
                      onClick={() => setBotTab('rider')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${botTab === 'rider' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      🛵 Rider Dispatch Bot
                    </button>
                  </div>
                </div>

                {/* Bot Chat UI */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[550px]">
                  <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                        {botTab === 'vendor' ? '👨‍🍳' : '🛵'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {botTab === 'vendor' ? 'FoodFlow Vendor Bot (@FoodFlowVendorBot)' : 'FoodFlow Rider Bot (@FoodFlowRiderBot)'}
                        </h4>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Online • Connected to Render Backend</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleBotCommandClick('/start')} className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl font-bold border border-slate-700">
                        /start
                      </button>
                      {botTab === 'rider' ? (
                        <button onClick={() => handleBotCommandClick('/online')} className="text-xs bg-emerald-950 text-emerald-400 px-3 py-1.5 rounded-xl font-bold border border-emerald-800">
                          /online
                        </button>
                      ) : (
                        <button onClick={() => handleBotCommandClick('/status')} className="text-xs bg-amber-950 text-amber-400 px-3 py-1.5 rounded-xl font-bold border border-amber-800">
                          /status
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {botMessages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-md p-4 rounded-3xl text-xs leading-relaxed shadow-md ${
                          m.sender === 'user' 
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none' 
                            : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none'
                        }`}>
                          <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }} />
                          {m.inlineButtons && (
                            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                              {m.inlineButtons.flat().map((btn, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleBotCommandClick(btn.text)}
                                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                                >
                                  {btn.text}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendBotMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder={`Send a command to ${botTab === 'vendor' ? 'Vendor' : 'Rider'} bot (e.g. /start, /online, /status)...`}
                      value={botInput}
                      onChange={e => setBotInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-3 rounded-2xl shadow-lg shadow-amber-500/25 transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ================= ADMIN PORTAL ================= */}
            {activePortal === 'admin' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  <span className="text-xs text-amber-400 font-bold">CENTRAL ADMIN CONTROL</span>
                  <h2 className="text-2xl font-black text-white mt-1">Ecosystem Analytics & Database State</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Monitor total platform orders, vendor kitchen revenue, and Supabase synchronization.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                    <span className="text-xs text-slate-400 font-semibold">Total Platform Orders</span>
                    <h3 className="text-2xl font-black text-white">{orders.length}</h3>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                    <span className="text-xs text-slate-400 font-semibold">Partner Restaurants</span>
                    <h3 className="text-2xl font-black text-white">{restaurants.length}</h3>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                    <span className="text-xs text-slate-400 font-semibold">Active Menu Dishes</span>
                    <h3 className="text-2xl font-black text-white">{foodItems.length}</h3>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                    <span className="text-xs text-slate-400 font-semibold">Platform Revenue</span>
                    <h3 className="text-2xl font-black text-amber-400">৳{orders.reduce((sum, o) => sum + (o.total || 0), 0)}</h3>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= MODALS ================= */}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Complete Your Order</h3>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Delivery Address (Dhaka)</label>
                <textarea
                  rows={2}
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'cod' ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    💵 Cash on Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'bkash' ? 'bg-pink-500/20 text-pink-300 border-pink-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    📱 bKash Online
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Payable</span>
                  <span className="text-lg font-black text-amber-400">৳{cartTotal}</span>
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-lg shadow-amber-500/25 transition-all"
                >
                  Place Order Now 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Dish Modal */}
      {showAddDish && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add New Dish to Menu</h3>
              <button onClick={() => setShowAddDish(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishDish} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Chicken Biryani"
                  value={newDishName}
                  onChange={e => setNewDishName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Price (৳ BDT)</label>
                  <input
                    type="number"
                    placeholder="350"
                    value={newDishPrice}
                    onChange={e => setNewDishPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newDishCategory}
                    onChange={e => setNewDishCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="Biryani">Biryani</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Kitchen / Vendor Name</label>
                <input
                  type="text"
                  value={newVendorName}
                  onChange={e => setNewVendorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Dish Photo (Supabase Storage Upload)</label>
                <label className="border-2 border-dashed border-slate-700 hover:border-amber-500 bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <ImageIcon className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="text-xs text-slate-300 font-bold">Click to upload image</span>
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                </label>
                {uploadingImg && <p className="text-xs text-amber-400 mt-1">Uploading to Supabase Storage bucket...</p>}
                {uploadError && <p className="text-xs text-rose-400 mt-1">{uploadError}</p>}
                {newDishImage && <p className="text-xs text-emerald-400 mt-1 truncate">✓ Image uploaded successfully: {newDishImage}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Delicious spiced rice with tender chicken piece..."
                  value={newDishDesc}
                  onChange={e => setNewDishDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-medium focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddDish(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20">
                  Publish Dish 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backend URL Config Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Configure Render Backend URL</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBackendUrl} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Backend URL (Render)</label>
                <input
                  type="url"
                  placeholder="https://foodflow-backend.onrender.com"
                  value={backendUrl}
                  onChange={e => setBackendUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  When deployed on GitHub Pages, enter your Render backend URL here so all customer, vendor, and bot requests sync to the central database.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl">
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Order Success Banner */}
      {activeOrder && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-amber-500/50 p-5 rounded-3xl shadow-2xl max-w-sm z-50 space-y-3 animate-bounce">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400">Order Placed Successfully! (#{activeOrder.id})</span>
            <button onClick={() => setActiveOrder(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Your order has been dispatched to the vendor kitchen & Telegram bot. Status: <span className="text-amber-400 font-bold uppercase">{activeOrder.status}</span>
          </p>
        </div>
      )}
    </div>
  );
}
