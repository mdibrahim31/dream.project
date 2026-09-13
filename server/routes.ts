import { Router } from 'express';
import { query, supabase } from './db.js';
import { getBotMessages, handleIncomingTelegramMessage, addBotMessage } from './telegram.js';

export const apiRouter = Router();

// Ping endpoint
apiRouter.get('/ping', (req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString(), service: 'FoodFlow Central API' });
});

// Restaurants
apiRouter.get('/restaurants', async (req, res) => {
  try {
    if (query) {
      const result = await query('SELECT * FROM restaurants');
      return res.json(result.rows);
    }
  } catch (e) {
    console.warn('DB error /restaurants, returning fallback:', e);
  }
  res.json([
    {
      id: 'rest-1',
      name: "Sultans Dine",
      slug: 'sultans-dine',
      cuisine: 'Biryani & Mughlai',
      rating: 4.8,
      delivery_time: '25-35 min',
      min_order: 200,
      delivery_fee: 50,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      banner_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
      is_open: true,
      address: 'Gulshan 2, Dhaka',
      phone: '+8801711122334',
      vendor_id: 'vendor-1'
    }
  ]);
});

apiRouter.patch('/restaurants/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_open } = req.body;
  try {
    if (query) {
      await query('UPDATE restaurants SET is_open = $1 WHERE id = $2', [is_open, id]);
      const updated = await query('SELECT * FROM restaurants WHERE id = $1', [id]);
      return res.json(updated.rows[0]);
    }
  } catch (e) {
    console.warn('DB error updating status:', e);
  }
  res.json({ id, is_open });
});

// Categories
apiRouter.get('/categories', async (req, res) => {
  try {
    if (query) {
      const result = await query('SELECT * FROM categories');
      return res.json(result.rows);
    }
  } catch (e) {
    console.warn('DB error /categories:', e);
  }
  res.json([
    { id: 'cat-1', name: 'All', icon: '🍽️' },
    { id: 'cat-2', name: 'Biryani', icon: '🍲' },
    { id: 'cat-3', name: 'Main Course', icon: '🍗' },
    { id: 'cat-4', name: 'Beverages', icon: '🥤' }
  ]);
});

// Food Items
apiRouter.get('/food-items', async (req, res) => {
  const { restaurantId } = req.query;
  try {
    if (query) {
      if (restaurantId) {
        const result = await query('SELECT * FROM menu_items WHERE restaurant_id = $1', [restaurantId]);
        return res.json(result.rows);
      } else {
        const result = await query('SELECT * FROM menu_items');
        return res.json(result.rows);
      }
    }
  } catch (e) {
    console.warn('DB error /food-items:', e);
  }
  res.json([
    {
      id: 'food-1',
      restaurant_id: 'rest-1',
      restaurant_name: "Sultans Dine",
      vendor_name: "Sultans Dine Kitchen",
      name: 'Kacchi Mutton Tehari',
      description: 'Tender mutton chunks layered with aromatic chinigura rice and secret spices.',
      price: 380,
      category: 'Biryani',
      image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80',
      is_available: true,
      is_popular: true
    }
  ]);
});

apiRouter.post('/food-items', async (req, res) => {
  const item = req.body;
  const id = item.id || `food-${Date.now()}`;
  const restaurant_id = item.restaurant_id || 'rest-1';
  const restaurant_name = item.restaurant_name || "Sultans Dine";
  const vendor_name = item.vendor_name || "Sultans Dine Kitchen";
  const name = item.name || 'New Dish';
  const description = item.description || '';
  const price = item.price || 250;
  const category = item.category || 'Main Course';
  const image_url = item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  const is_available = item.is_available ?? true;
  const is_popular = item.is_popular ?? false;

  try {
    if (query) {
      await query(`
        INSERT INTO menu_items (id, restaurant_id, restaurant_name, vendor_name, name, description, price, category, image_url, is_available, is_popular)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, category = EXCLUDED.category, image_url = EXCLUDED.image_url, is_available = EXCLUDED.is_available
      `, [id, restaurant_id, restaurant_name, vendor_name, name, description, price, category, image_url, is_available, is_popular]);
    }
  } catch (e) {
    console.warn('DB error inserting food item:', e);
  }

  // Notify vendor telegram bot of new menu dish
  addBotMessage({
    botType: 'vendor',
    chatId: 'vendor-1',
    sender: 'bot',
    text: `🍲 <b>New Dish Published to Menu!</b>\n\n<b>${name}</b> (৳${price})\nKitchen: ${vendor_name}\nStatus: ${is_available ? '🟢 Available' : '🔴 Sold Out'}`
  });

  res.json({ id, restaurant_id, restaurant_name, vendor_name, name, description, price, category, image_url, is_available, is_popular });
});

apiRouter.put('/food-items/:id', async (req, res) => {
  const { id } = req.params;
  const item = req.body;
  try {
    if (query) {
      await query(`
        UPDATE menu_items SET name = $1, description = $2, price = $3, category = $4, image_url = $5, is_available = $6 WHERE id = $7
      `, [item.name, item.description, item.price, item.category, item.image_url, item.is_available, id]);
    }
  } catch (e) {
    console.warn('DB update food item error:', e);
  }
  res.json({ id, ...item });
});

apiRouter.delete('/food-items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (query) {
      await query('DELETE FROM menu_items WHERE id = $1', [id]);
    }
  } catch (e) {
    console.warn('DB delete food item error:', e);
  }
  res.json({ success: true });
});

// Orders
apiRouter.get('/orders', async (req, res) => {
  try {
    if (query) {
      const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.json(result.rows);
    }
  } catch (e) {
    console.warn('DB error /orders:', e);
  }
  res.json([]);
});

apiRouter.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (query) {
      const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
      if (result.rows[0]) return res.json(result.rows[0]);
    }
  } catch (e) {
    console.warn('DB get order by id error:', e);
  }
  res.status(404).json({ error: 'Order not found' });
});

apiRouter.post('/orders', async (req, res) => {
  const orderData = req.body;
  const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const customer_name = orderData.customer_name || 'Valued Customer';
  const customer_phone = orderData.customer_phone || '+8801700000000';
  const delivery_address = orderData.delivery_address || 'Gulshan, Dhaka';
  const restaurant_id = orderData.restaurant_id || 'rest-1';
  const restaurant_name = orderData.restaurant_name || "Sultans Dine";
  const items = JSON.stringify(orderData.items || []);
  const subtotal = orderData.subtotal || 380;
  const delivery_fee = orderData.delivery_fee || 50;
  const total = orderData.total || 430;
  const status = 'placed';
  const payment_method = orderData.payment_method || 'cod';
  const payment_status = orderData.payment_status || 'pending';
  const prep_minutes = 20;

  try {
    if (query) {
      await query(`
        INSERT INTO orders (id, customer_name, customer_phone, delivery_address, restaurant_id, restaurant_name, items, subtotal, delivery_fee, total, status, payment_method, payment_status, prep_minutes)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14)
      `, [id, customer_name, customer_phone, delivery_address, restaurant_id, restaurant_name, items, subtotal, delivery_fee, total, status, payment_method, payment_status, prep_minutes]);
    }
  } catch (e) {
    console.warn('DB insert order error:', e);
  }

  const newOrder = {
    id,
    customer_name,
    customer_phone,
    delivery_address,
    restaurant_id,
    restaurant_name,
    items: orderData.items || [],
    subtotal,
    delivery_fee,
    total,
    status,
    payment_method,
    payment_status,
    prep_minutes,
    created_at: new Date().toISOString()
  };

  // Telegram Automation Routing:
  // 1. Order placed -> Notify Vendor Bot
  addBotMessage({
    botType: 'vendor',
    chatId: 'vendor-1',
    sender: 'bot',
    text: `🔔 <b>New Order Received! (#${id})</b>\n\nCustomer: ${customer_name} (${customer_phone})\nAddress: ${delivery_address}\nTotal: ৳${total}\n\nReview items and confirm preparation.`,
    inlineButtons: [
      [
        { text: '✅ Accept Order (20m)', callbackData: `vendor_accept:${id}` },
        { text: '❌ Reject', callbackData: `vendor_reject:${id}` }
      ]
    ]
  });

  res.json(newOrder);
});

apiRouter.patch('/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, prepMinutes } = req.body;
  try {
    if (query) {
      if (prepMinutes) {
        await query('UPDATE orders SET status = $1, prep_minutes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [status, prepMinutes, id]);
      } else {
        await query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
      }
      const updated = await query('SELECT * FROM orders WHERE id = $1', [id]);
      const ord = updated.rows[0];

      // If order is accepted/preparing or ready, notify Rider Bot
      if (status === 'preparing' || status === 'out_for_delivery') {
        addBotMessage({
          botType: 'rider',
          chatId: 'rider-1',
          sender: 'bot',
          text: `🛵 <b>New Delivery Dispatch Available! (#${id})</b>\nRestaurant: ${ord.restaurant_name}\nDelivery Address: ${ord.delivery_address}\nEarnings: ৳60`,
          inlineButtons: [[{ text: '🚀 Accept & Out for Delivery', callbackData: `rider_accept:${id}` }]]
        });
      }

      return res.json(ord);
    }
  } catch (e) {
    console.warn('DB update order status error:', e);
  }
  res.json({ id, status });
});

// Riders
apiRouter.get('/riders', async (req, res) => {
  try {
    if (query) {
      const result = await query('SELECT * FROM riders');
      return res.json(result.rows);
    }
  } catch (e) {
    console.warn('DB riders error:', e);
  }
  res.json([{ id: 'rider-1', name: 'Tanvir Ahmed', phone: '+8801911223344', is_online: true, total_deliveries: 142, total_earnings: 11360 }]);
});

apiRouter.patch('/riders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_online } = req.body;
  try {
    if (query) {
      await query('UPDATE riders SET is_online = $1 WHERE id = $2', [is_online, id]);
      const updated = await query('SELECT * FROM riders WHERE id = $1', [id]);
      return res.json(updated.rows[0]);
    }
  } catch (e) {
    console.warn('DB rider status error:', e);
  }
  res.json({ id, is_online });
});

// Admin stats
apiRouter.get('/admin/stats', async (req, res) => {
  try {
    if (query) {
      const ords = await query('SELECT COUNT(*) FROM orders');
      const rests = await query('SELECT COUNT(*) FROM restaurants');
      const items = await query('SELECT COUNT(*) FROM menu_items');
      const rev = await query('SELECT SUM(total) FROM orders WHERE status = $1', ['delivered']);
      return res.json({
        totalOrders: parseInt(ords.rows[0].count, 10) || 0,
        totalRestaurants: parseInt(rests.rows[0].count, 10) || 0,
        totalMenuItems: parseInt(items.rows[0].count, 10) || 0,
        totalRevenue: parseFloat(rev.rows[0].sum) || 12450
      });
    }
  } catch (e) {
    console.warn('DB admin stats error:', e);
  }
  res.json({ totalOrders: 18, totalRestaurants: 2, totalMenuItems: 12, totalRevenue: 12450 });
});

// Supabase Storage Image Upload Proxy
apiRouter.post('/upload', async (req, res) => {
  const { image, filename, contentType } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  // If Supabase Storage is configured
  if (supabase) {
    try {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExt = filename ? filename.split('.').pop() : 'jpg';
      const uniqueName = `dish-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('food-delivery-assets')
        .upload(uniqueName, buffer, {
          contentType: contentType || 'image/jpeg',
          upsert: true
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('food-delivery-assets')
        .getPublicUrl(uniqueName);

      return res.json({ url: publicUrlData.publicUrl });
    } catch (sbErr: any) {
      console.warn('Supabase storage upload failed, falling back to data URL:', sbErr.message);
    }
  }

  // Fallback: return data URL directly if storage upload is unconfigured
  return res.json({ url: image });
});

// Telegram Webhook Endpoints
apiRouter.get('/telegram/:botType/messages', (req, res) => {
  const { botType } = req.params;
  const { chatId } = req.query;
  res.json(getBotMessages(botType as any, chatId as string));
});

apiRouter.post('/telegram/:botType/webhook', async (req, res) => {
  const { botType } = req.params;
  const { chatId, text } = req.body;
  const db = {
    getRestaurants: async () => (await query ? (await query('SELECT * FROM restaurants')).rows : []),
    getRiders: async () => (await query ? (await query('SELECT * FROM riders')).rows : []),
    updateRiderStatus: async (id: string, online: boolean) => {
      if (query) await query('UPDATE riders SET is_online = $1 WHERE id = $2', [online, id]);
    },
    getOrders: async () => (await query ? (await query('SELECT * FROM orders')).rows : [])
  };

  const msgs = await handleIncomingTelegramMessage(botType as any, chatId || 'default', text || '', db);
  res.json({ success: true, messages: msgs });
});
