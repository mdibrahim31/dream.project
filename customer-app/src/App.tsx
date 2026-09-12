import React, { useState, useEffect } from 'react';
import { Restaurant, Category, FoodItem, CartItem, Order } from './types';
import { api } from './services/api';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  Star, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  ChefHat, 
  Store, 
  X, 
  Sparkles, 
  RefreshCw,
  Bike,
  ShieldAlert
} from 'lucide-react';

export default function CustomerApp() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [resList, catList, menuList, ordersList] = await Promise.all([
        api.getRestaurants(),
        api.getCategories(),
        api.getFoodItems(),
        api.getOrders()
      ]);
      setRestaurants(resList);
      setCategories(catList);
      setFoodItems(menuList);
      setActiveOrders(ordersList);
      if (ordersList.length > 0 && !selectedOrder) {
        setSelectedOrder(ordersList[0]);
      } else if (selectedOrder) {
        const updated = ordersList.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error('Failed to load customer data:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // Background polling for real-time order tracking & menu updates from Supabase
    const interval = setInterval(() => {
      loadData(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedOrder?.id]);

  // Cart operations
  const addToCart = (food: FoodItem, rest: Restaurant) => {
    if (cart.length > 0 && cart[0].restaurant.id !== rest.id) {
      if (!window.confirm(`Your cart has items from ${cart[0].restaurant.name}. Start a new basket from ${rest.name}?`)) {
        return;
      }
      setCart([{ food, restaurant: rest, quantity: 1 }]);
      setIsCartOpen(true);
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.food.id === food.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { food, restaurant: rest, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (foodId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.food.id === foodId) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  const currentRestaurant = cart.length > 0 ? cart[0].restaurant : null;
  const deliveryFee = currentRestaurant ? currentRestaurant.delivery_fee : 0;
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee : 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !currentRestaurant) return;
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      alert('Please enter your Name, Phone Number, and Delivery Address.');
      return;
    }

    try {
      setIsPlacingOrder(true);
      const newOrder = await api.createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        notes: orderNotes,
        restaurant_id: currentRestaurant.id,
        restaurant_name: currentRestaurant.name,
        items: cart.map(c => ({
          food_id: c.food.id,
          name: c.food.name,
          price: c.food.price,
          quantity: c.quantity,
          instructions: c.instructions || ''
        })),
        subtotal: cartSubtotal,
        delivery_fee: deliveryFee,
        total: cartTotal,
        status: 'placed'
      });

      setSelectedOrder(newOrder);
      setCart([]);
      setIsCartOpen(false);
      setOrderSuccessMsg(`🎉 Order #${newOrder.id} successfully placed! Dispatched to ${currentRestaurant.name}'s Kitchen.`);
      loadData(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(`Order placement failed: ${err.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredFoods = foodItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRestaurant = !selectedRestaurant || item.restaurant_id === selectedRestaurant.id;
    return matchesCategory && matchesSearch && matchesRestaurant;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'placed': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'preparing': return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'ready': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'out_for_delivery': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse';
      case 'delivered': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'cancelled': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getStatusStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'placed': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered': return 5;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Standalone Customer Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedRestaurant(null)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20">
              🍔
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">FoodFlow</span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Customer App
              </span>
              <p className="text-[10px] text-slate-400">Order Hot Meals from Top Restaurants</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs hidden sm:inline">My Basket</span>
              {cart.length > 0 && (
                <span className="bg-slate-950 text-amber-400 text-xs font-black px-2 py-0.5 rounded-full border border-amber-400">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Success Alert */}
        {orderSuccessMsg && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-emerald-200 text-xs">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{orderSuccessMsg}</span>
            </div>
            <button onClick={() => setOrderSuccessMsg(null)} className="text-emerald-400 hover:text-white font-bold p-1">✕</button>
          </div>
        )}

        {/* Live Active Order Tracker */}
        {selectedOrder && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                  <Bike className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white">Live Tracking: Order #{selectedOrder.id}</h2>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Restaurant: <span className="text-slate-200 font-semibold">{selectedOrder.restaurant_name}</span> • Placed at {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadData(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="pt-6 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                {[
                  { step: 1, label: 'Order Placed', desc: 'Sent to Restaurant' },
                  { step: 2, label: 'In Kitchen', desc: 'Chef Cooking' },
                  { step: 3, label: 'Food Ready', desc: 'Rider Dispatched' },
                  { step: 4, label: 'On The Way', desc: 'Rider En Route' },
                  { step: 5, label: 'Delivered', desc: 'Enjoy Your Meal!' }
                ].map((s) => {
                  const currentStep = getStatusStepIndex(selectedOrder.status);
                  const isDone = currentStep >= s.step;
                  const isCurrent = currentStep === s.step;
                  return (
                    <div
                      key={s.step}
                      className={`p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500'
                          : isDone
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Step 0{s.step}</div>
                      <div className="font-bold text-xs text-white">{s.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-80">{s.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assigned Rider Banner */}
            {selectedOrder.rider_name && (
              <div className="mt-4 p-3.5 bg-sky-950/40 border border-sky-500/30 rounded-2xl flex items-center justify-between text-xs text-sky-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/30 flex items-center justify-center font-bold text-sky-300">
                    🛵
                  </div>
                  <div>
                    <span className="font-bold text-white block">Assigned Rider: {selectedOrder.rider_name}</span>
                    <span className="text-[11px] text-sky-300/80">Phone: {selectedOrder.rider_phone || 'Available via bot'}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase tracking-wider border border-sky-500/40">
                  Active Dispatch
                </span>
              </div>
            )}
          </section>
        )}

        {/* Hero Banner & Search Bar */}
        <section className="bg-gradient-to-r from-amber-600 to-red-600 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-wider border border-white/20 inline-flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Fastest 30-Min Delivery in City</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Craving Delicious Food? We Deliver Hot & Fresh.
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm">
              Discover Dhaka's top biryani, juicy burgers, crispy pizzas & desserts delivered to your doorstep.
            </p>

            {/* Search Box */}
            <div className="pt-2 flex items-center bg-slate-950/90 backdrop-blur-md rounded-2xl p-2 border border-slate-700 shadow-xl max-w-lg">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search food, burgers, biryani, or restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs sm:text-sm text-white px-3 focus:outline-none placeholder-slate-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-white mr-2">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Food Categories</h2>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="flex space-x-2.5 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-102'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🍽️</span>
              <span>All Menu</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-102'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{cat.icon || '🍛'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Restaurants Selection */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Top Partner Restaurants</h2>
              <p className="text-xs text-slate-400">Click a restaurant to filter its exclusive kitchen menu</p>
            </div>
            {selectedRestaurant && (
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Show All Restaurants
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {restaurants.map(rest => {
              const isSelected = selectedRestaurant?.id === rest.id;
              return (
                <div
                  key={rest.id}
                  onClick={() => setSelectedRestaurant(isSelected ? null : rest)}
                  className={`bg-slate-900 rounded-2xl overflow-hidden border cursor-pointer transition-all hover:scale-101 shadow-md ${
                    isSelected ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-32 w-full relative overflow-hidden bg-slate-800">
                    <img
                      src={rest.image_url}
                      alt={rest.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{rest.rating}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="font-bold text-sm text-white">{rest.name}</h3>
                    <p className="text-xs text-slate-400">{rest.cuisine}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>{rest.delivery_time}</span>
                      </span>
                      <span className="font-semibold text-emerald-400">Delivery ৳{rest.delivery_fee}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Food Items Catalog */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              {selectedRestaurant ? `${selectedRestaurant.name}'s Menu` : 'Featured Dishes'} ({filteredFoods.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
              Loading restaurant kitchen catalogs...
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-400 space-y-2">
              <p className="text-sm font-semibold">No food items found matching your filters.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setSelectedRestaurant(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFoods.map(food => {
                const rest = restaurants.find(r => r.id === food.restaurant_id) || {
                  id: food.restaurant_id,
                  name: 'Partner Restaurant',
                  delivery_fee: 40,
                  delivery_time: '30 mins'
                } as Restaurant;

                return (
                  <div
                    key={food.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="h-44 w-full relative bg-slate-800 overflow-hidden">
                        <img
                          src={food.image_url}
                          alt={food.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as any).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-slate-700">
                          {food.category}
                        </span>
                        {!food.is_available && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center font-bold text-rose-400 text-xs">
                            Sold Out Today
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-white">{food.name}</h3>
                          <span className="text-sm font-black text-amber-400">৳{food.price}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{food.description}</p>
                        <p className="text-[11px] text-slate-500 font-medium">🏪 {rest.name}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => addToCart(food, rest)}
                        disabled={!food.is_available}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-xs font-bold rounded-2xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-98"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add to Basket</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Cart Drawer / Slide-Over Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
            
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">Your Basket</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {currentRestaurant && (
                <div className="mt-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Ordering From</span>
                    <span className="font-bold text-white">{currentRestaurant.name}</span>
                  </div>
                  <span className="text-emerald-400 font-medium">Est. {currentRestaurant.delivery_time}</span>
                </div>
              )}

              {/* Items List */}
              <div className="mt-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
                    <p>Your basket is empty. Add delicious items from the menu!</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.food.id}
                      className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-white block">{item.food.name}</span>
                        <span className="text-amber-400 font-semibold">৳{item.food.price * item.quantity}</span>
                      </div>

                      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.food.id, -1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-white text-xs px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.food.id, 1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Checkout Form & Order Button */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="mt-6 pt-4 border-t border-slate-800 space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Delivery Details</span>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number (e.g. 01700-000000)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Delivery Address (House, Road, Area)..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Price Breakdown */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>৳{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee</span>
                    <span>৳{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-1.5 border-t border-slate-800 text-sm">
                    <span>Total Bill (Cash on Delivery)</span>
                    <span className="text-amber-400">৳{cartTotal}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-98"
                >
                  {isPlacingOrder ? 'Submitting Order to Kitchen...' : `Place Order (৳${cartTotal})`}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
