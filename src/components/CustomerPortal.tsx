import React, { useState, useEffect } from 'react';
import { Restaurant, Category, FoodItem, CartItem, Order } from '../types';
import { api } from '../services/api';
import { 
  Search, 
  Star, 
  Clock, 
  Bike, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Phone,
  ChefHat,
  Store,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface CustomerPortalProps {
  onOpenBots: () => void;
  onOpenVendor: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOrderPlaced: (order: Order) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onOpenBots,
  onOpenVendor,
  cart,
  setCart,
  isCartOpen,
  setIsCartOpen,
  onOrderPlaced
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'menu' | 'track' | 'history'>('menu');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Food Item Modal
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemInstructions, setItemInstructions] = useState<string>('');

  // Checkout Form State
  const [customerName, setCustomerName] = useState<string>('Rahim Chowdhury');
  const [customerPhone, setCustomerPhone] = useState<string>('+880 1712-345678');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Flat 4B, House 18, Road 4, Dhanmondi, Dhaka');
  const [orderNotes, setOrderNotes] = useState<string>('Please do not ring the bell, call when outside.');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
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
      }
    } catch (err) {
      console.error('Failed to load customer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        const orders = await api.getOrders();
        setActiveOrders(orders);
        if (selectedOrder) {
          const updated = orders.find(o => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      } catch (e) {
        // silent
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedOrder?.id]);

  const handleAddToCart = (food: FoodItem) => {
    const existingIndex = cart.findIndex(item => item.food.id === food.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { food, quantity: 1, instructions: '' }]);
    }
  };

  const handleAddFromModal = () => {
    if (!selectedFood) return;
    const existingIndex = cart.findIndex(item => item.food.id === selectedFood.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += itemQuantity;
      updated[existingIndex].instructions = itemInstructions;
      setCart(updated);
    } else {
      setCart([...cart, { food: selectedFood, quantity: itemQuantity, instructions: itemInstructions }]);
    }
    setSelectedFood(null);
    setItemQuantity(1);
    setItemInstructions('');
  };

  const updateCartQuantity = (foodId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.food.id === foodId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];
    setCart(updated);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? 40 : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      setIsPlacingOrder(true);
      const restaurantId = cart[0].food.restaurant_id;
      const restaurant = restaurants.find(r => r.id === restaurantId) || restaurants[0];

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        items: cart.map(item => ({
          food_id: item.food.id,
          name: item.food.name,
          price: item.food.price,
          quantity: item.quantity,
          instructions: item.instructions
        })),
        subtotal: cartSubtotal,
        delivery_fee: deliveryFee,
        total: cartTotal,
        status: 'placed',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'online' ? 'paid' : 'pending',
        notes: orderNotes,
        estimated_delivery_time: '30-40 mins'
      };

      const createdOrder = await api.createOrder(orderData);
      onOrderPlaced(createdOrder);
      setCart([]);
      setIsCartOpen(false);
      setSelectedOrder(createdOrder);
      setActiveTab('track');
      setOrderSuccessMsg(`Order #${createdOrder.id} placed successfully! Dispatched to Vendor & Rider Telegram bot.`);
      setTimeout(() => setOrderSuccessMsg(null), 8000);
      loadData();
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredFoodItems = foodItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesRestaurant = !selectedRestaurant || item.restaurant_id === selectedRestaurant.id;
    return matchesSearch && matchesCategory && matchesRestaurant;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      
      {/* Sub-Navigation & Quick Tab Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-13">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              id="cust-tab-menu"
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🍽️ Explore Restaurants & Menu
            </button>
            <button
              id="cust-tab-track"
              onClick={() => setActiveTab('track')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === 'track'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛵 Live Order Tracker
              {activeOrders.some(o => o.status !== 'delivered' && o.status !== 'cancelled') && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white animate-pulse">
                  Live
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs flex items-center space-x-1"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {orderSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">{orderSuccessMsg}</span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={onOpenBots}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1 rounded-lg font-bold"
              >
                View Rider/Vendor Bot
              </button>
              <button onClick={() => setOrderSuccessMsg(null)} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MENU & EXPLORER */}
      {activeTab === 'menu' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          
          {/* Hero Banner with Integrated Search */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-slate-800 p-6 sm:p-10 mb-8 shadow-xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Delivery • 30 Minutes or Free</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
                Craving Delicious Food? <span className="text-amber-400">Order from Top Restaurants</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mb-6">
                Connected directly to restaurant kitchens and delivery riders via real-time web & Telegram bots.
              </p>

              {/* Search Bar */}
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4" />
                <input
                  id="food-search-input"
                  type="text"
                  placeholder="Search biryani, gourmet burgers, woodfired pizza, drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-inner"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Restaurant Filter Cards */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Featured Partner Kitchens</span>
                <span className="text-xs text-slate-400 font-normal">({restaurants.length} active)</span>
              </h2>
              {selectedRestaurant && (
                <button
                  onClick={() => setSelectedRestaurant(null)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Clear filter (Show all restaurants)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map((rest) => {
                const isSelected = selectedRestaurant?.id === rest.id;
                return (
                  <div
                    key={rest.id}
                    id={`restaurant-card-${rest.id}`}
                    onClick={() => setSelectedRestaurant(isSelected ? null : rest)}
                    className={`cursor-pointer rounded-xl overflow-hidden border transition-all duration-200 bg-slate-900 group ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={rest.banner_url || rest.image_url}
                        alt={rest.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                      
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rest.is_open ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                        }`}>
                          {rest.is_open ? 'Open Now' : 'Closed'}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white">{rest.name}</h3>
                          <p className="text-[11px] text-slate-300 truncate">{rest.cuisine}</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-700 text-xs font-bold text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{rest.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-3.5 py-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rest.delivery_time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bike className="w-3.5 h-3.5 text-slate-400" />
                        <span>৳{rest.delivery_fee} delivery</span>
                      </div>
                      <div className="text-amber-400 font-semibold">
                        {isSelected ? '✓ Selected' : 'View Menu'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mb-6 overflow-x-auto pb-2 flex space-x-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`cat-pill-${cat.id}`}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Food Menu Items Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">
                {selectedRestaurant ? `${selectedRestaurant.name} Menu` : 'All Available Delicacies'}
                <span className="text-xs text-slate-400 font-normal ml-2">({filteredFoodItems.length} items)</span>
              </h2>
            </div>

            {filteredFoodItems.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300">No dishes found matching your criteria</h3>
                <p className="text-xs text-slate-500 mt-1">Try changing category or clearing your search query.</p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setSelectedRestaurant(null); }}
                  className="mt-4 px-4 py-2 bg-slate-800 text-xs font-bold text-amber-400 rounded-xl hover:bg-slate-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFoodItems.map((food) => {
                  const inCartItem = cart.find(i => i.food.id === food.id);
                  return (
                    <div
                      key={food.id}
                      id={`food-card-${food.id}`}
                      className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="relative h-40 overflow-hidden cursor-pointer" onClick={() => setSelectedFood(food)}>
                        <img
                          src={food.image_url}
                          alt={food.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {food.is_popular && (
                          <span className="absolute top-2.5 left-2.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-md shadow-md">
                            ★ Popular
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-sm text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">
                          {food.category}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 
                            className="font-bold text-sm text-white hover:text-amber-400 cursor-pointer line-clamp-1"
                            onClick={() => setSelectedFood(food)}
                          >
                            {food.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {food.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-400 font-medium">Price</span>
                            <p className="text-base font-black text-amber-400">৳{food.price}</p>
                          </div>

                          {inCartItem ? (
                            <div className="flex items-center space-x-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                              <button
                                onClick={() => updateCartQuantity(food.id, -1)}
                                className="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 text-xs font-bold"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-white px-1">{inCartItem.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(food.id, 1)}
                                className="w-6 h-6 rounded bg-amber-500 text-slate-950 flex items-center justify-center hover:bg-amber-400 text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`add-to-cart-${food.id}`}
                              onClick={() => handleAddToCart(food)}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* VIEW: LIVE ORDER TRACKER */}
      {activeTab === 'track' && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Live Order Tracking</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time status synced with Vendor & Rider Telegram Bots</p>
            </div>
            {selectedOrder && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Order #{selectedOrder.id}
              </span>
            )}
          </div>

          {activeOrders.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No active orders yet</h3>
              <p className="text-xs text-slate-400 mt-1">Place an order from the menu to test the real-time workflow!</p>
              <button
                onClick={() => setActiveTab('menu')}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order selector tabs if multiple */}
              {activeOrders.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                  {activeOrders.map(ord => (
                    <button
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedOrder?.id === ord.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      #{ord.id} ({ord.status.toUpperCase()})
                    </button>
                  ))}
                </div>
              )}

              {selectedOrder && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  
                  {/* Status Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs text-slate-400">Current Status</span>
                        <h3 className="text-lg font-black text-amber-400 capitalize">
                          {selectedOrder.status.replace(/_/g, ' ')}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Estimated Delivery</span>
                        <p className="text-sm font-bold text-white flex items-center justify-end space-x-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400 mr-1" />
                          {selectedOrder.estimated_delivery_time || '25-35 mins'}
                        </p>
                      </div>
                    </div>

                    {/* Step Tracker Visual */}
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {[
                        { key: 'placed', label: 'Placed', icon: '📝' },
                        { key: 'preparing', label: 'Kitchen', icon: '👨‍🍳' },
                        { key: 'ready', label: 'Ready', icon: '📦' },
                        { key: 'out_for_delivery', label: 'On Way', icon: '🛵' },
                        { key: 'delivered', label: 'Delivered', icon: '🎉' }
                      ].map((step, idx) => {
                        const stepOrder = ['placed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
                        const currentIdx = stepOrder.indexOf(selectedOrder.status === 'accepted' ? 'preparing' : selectedOrder.status === 'picked_up' ? 'out_for_delivery' : selectedOrder.status);
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div key={step.key} className="text-center">
                            <div className={`h-2 rounded-full mb-2 ${
                              isDone ? 'bg-amber-500' : 'bg-slate-800'
                            }`} />
                            <div className={`text-sm mb-1 ${isCurrent ? 'scale-125 transition-transform' : ''}`}>
                              {step.icon}
                            </div>
                            <span className={`text-[10px] font-bold block ${
                              isCurrent ? 'text-amber-400' : isDone ? 'text-slate-200' : 'text-slate-500'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rider & Vendor Dispatch Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
                        <Store className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white">Restaurant</span>
                      </div>
                      <p className="text-sm font-bold text-white">{selectedOrder.restaurant_name}</p>
                      <p className="text-xs text-slate-400 mt-1">Vendor Telegram Bot notified of your order.</p>
                      <button
                        onClick={onOpenVendor}
                        className="mt-3 text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        <span>Open Vendor Kitchen Portal</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
                        <Bike className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-white">Delivery Rider</span>
                      </div>
                      <p className="text-sm font-bold text-white">{selectedOrder.rider_name || 'Dispatching to nearby rider...'}</p>
                      <p className="text-xs text-slate-400 mt-1">{selectedOrder.rider_phone || 'Rider bot alert active'}</p>
                      <button
                        onClick={onOpenBots}
                        className="mt-3 text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                      >
                        <span>Open Rider Telegram Bot Simulator</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Ordered Items Summary */}
                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Order Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50">
                          <span className="text-slate-200">
                            <b className="text-amber-400">{item.quantity}x</b> {item.name}
                          </span>
                          <span className="font-bold text-white">৳{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 flex justify-between text-sm font-bold">
                      <span className="text-slate-300">Total Paid / Payable</span>
                      <span className="text-amber-400">৳{selectedOrder.total} ({selectedOrder.payment_method.toUpperCase()})</span>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Delivery to: {selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
                      <p className="text-slate-400 mt-0.5">{selectedOrder.delivery_address}</p>
                      {selectedOrder.notes && <p className="text-amber-300/80 mt-1 italic">Note: "{selectedOrder.notes}"</p>}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* FOOD DETAILS & CUSTOMIZATION MODAL */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="relative h-48">
              <img
                src={selectedFood.image_url}
                alt={selectedFood.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedFood(null)}
                className="absolute top-3 right-3 bg-slate-950/80 text-white p-1.5 rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{selectedFood.category}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedFood.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedFood.description}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Special Cooking Request / Instructions:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Less spicy, no onions, extra sauce..."
                  value={itemInstructions}
                  onChange={(e) => setItemInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center space-x-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-white">{itemQuantity}</span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center hover:bg-amber-400 font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddFromModal}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add ৳{selectedFood.price * itemQuantity}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART & CHECKOUT DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">Your Food Basket</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Your cart is empty</p>
                  <p className="text-xs text-slate-500 mt-1">Browse menus and add your favorite dishes!</p>
                </div>
              ) : (
                <div className="py-4 space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div className="flex-1 pr-3">
                        <h4 className="text-xs font-bold text-white line-clamp-1">{item.food.name}</h4>
                        <p className="text-[11px] text-amber-400 font-semibold">৳{item.food.price} each</p>
                        {item.instructions && (
                          <p className="text-[10px] text-slate-400 italic truncate mt-0.5">Note: {item.instructions}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                        <button
                          onClick={() => updateCartQuantity(item.food.id, -1)}
                          className="w-5 h-5 bg-slate-800 text-white rounded flex items-center justify-center text-xs hover:bg-slate-700 font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.food.id, 1)}
                          className="w-5 h-5 bg-amber-500 text-slate-950 rounded flex items-center justify-center text-xs hover:bg-amber-400 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Delivery Details Form */}
              {cart.length > 0 && (
                <form onSubmit={handleCheckout} className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Delivery Details</h4>
                  
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Delivery Address</label>
                    <textarea
                      rows={2}
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          paymentMethod === 'cod'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        💵 Cash on Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('online')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          paymentMethod === 'online'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        💳 Online / bKash / Card
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Bill Summary & Action Button */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>৳{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee</span>
                    <span>৳{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
                    <span>Total Bill</span>
                    <span className="text-amber-400">৳{cartTotal}</span>
                  </div>
                </div>

                <button
                  id="submit-checkout-btn"
                  onClick={handleCheckout}
                  disabled={isPlacingOrder}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <span>Placing Order & Alerting Bots...</span>
                  ) : (
                    <>
                      <span>Place Order (৳{cartTotal})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
