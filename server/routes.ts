import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { db, initDatabase } from './db.js';
import { telegramService, addBotMessage, getBotMessageHistory } from './telegram.js';
import { getPingStats, getPingLogs, recordPing } from './ping.js';

export const apiRouter = express.Router();

// ----------------------------------------------------
// SUPABASE STORAGE & FILE UPLOADS
// ----------------------------------------------------
apiRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const { image, filename, contentType } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const bucketName = 'food-delivery-assets';

    if (supabaseUrl && supabaseKey) {
      try {
        const cleanUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
        const supabase = createClient(cleanUrl, supabaseKey);

        // Ensure the bucket exists with public access
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          if (!buckets?.some(b => b.name === bucketName)) {
            await supabase.storage.createBucket(bucketName, { public: true });
          }
        } catch (bErr) {
          // Ignore if bucket creation fails or already exists
        }

        // Clean base64 string and build binary buffer
        const base64Data = image.includes(';base64,') ? image.split(';base64,')[1] : image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const rawExt = contentType?.split('/')[1] || filename?.split('.').pop() || 'jpg';
        const ext = rawExt.replace(/[^a-z0-9]/gi, '') || 'jpg';
        const safeName = `dish-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(safeName, buffer, {
            contentType: contentType || 'image/jpeg',
            upsert: true
          });

        if (error) {
          console.warn('Supabase storage upload error:', error.message);
          throw error;
        }

        // Retrieve public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(safeName);

        const finalUrl = publicUrlData?.publicUrl || `${cleanUrl}/storage/v1/object/public/${bucketName}/${safeName}`;

        return res.json({
          url: finalUrl,
          key: safeName,
          bucket: bucketName,
          success: true
        });
      } catch (sbErr: any) {
        console.warn('Falling back to direct data URL due to Supabase Storage notice:', sbErr.message);
      }
    }

    // Fallback: If Supabase Storage keys are not set in the environment, return the image data URL directly
    return res.json({
      url: image.startsWith('data:') ? image : `data:${contentType || 'image/jpeg'};base64,${image}`,
      key: `local-${Date.now()}`,
      bucket: 'food-delivery-assets',
      success: true
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: err.message || 'Image upload failed' });
  }
});

// ----------------------------------------------------
// PING / HEALTH / RENDER KEEP-ALIVE ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/ping', (req: Request, res: Response) => {
  const start = Date.now();
  recordPing(req.query.source ? String(req.query.source) : 'uptimerobot', Date.now() - start);
  res.status(200).json({
    status: 'ok',
    message: 'Server is 100% active & responding. Render instance kept alive.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

apiRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json(getPingStats());
});

apiRouter.get('/ping/logs', (req: Request, res: Response) => {
  res.json({
    stats: getPingStats(),
    logs: getPingLogs()
  });
});

// ----------------------------------------------------
// RESTAURANTS & MENU ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/restaurants', async (req: Request, res: Response) => {
  try {
    const restaurants = await db.getRestaurants();
    res.json(restaurants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const restaurant = await db.getRestaurantById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateRestaurant(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/restaurants/:id/status', async (req: Request, res: Response) => {
  try {
    const { is_open } = req.body;
    const updated = await db.updateRestaurant(req.params.id, { is_open: Boolean(is_open) });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await db.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get(['/menu', '/food-items', '/menu-items', '/menu_items'], async (req: Request, res: Response) => {
  try {
    const restaurantId = req.query.restaurantId ? String(req.query.restaurantId) : (req.query.restaurant_id ? String(req.query.restaurant_id) : undefined);
    const items = await db.getFoodItems(restaurantId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post(['/menu', '/food-items', '/menu-items', '/menu_items'], async (req: Request, res: Response) => {
  try {
    const item = await db.createFoodItem(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put(['/menu/:id', '/food-items/:id', '/menu-items/:id', '/menu_items/:id'], async (req: Request, res: Response) => {
  try {
    const updated = await db.updateFoodItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete(['/menu/:id', '/food-items/:id', '/menu-items/:id', '/menu_items/:id'], async (req: Request, res: Response) => {
  try {
    const success = await db.deleteFoodItem(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ORDERS ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const { restaurant_id, rider_id, status } = req.query;
    const orders = await db.getOrders({
      restaurant_id: restaurant_id ? String(restaurant_id) : undefined,
      rider_id: rider_id ? String(rider_id) : undefined,
      status: status ? String(status) : undefined
    });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const order = await db.createOrder(req.body);

    // Trigger Telegram notification for vendor
    await telegramService.notifyVendorNewOrder(order);

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, rider_id, rider_name, rider_phone } = req.body;
    const updated = await db.updateOrderStatus(req.params.id, status, { rider_id, rider_name, rider_phone });
    if (!updated) return res.status(404).json({ error: 'Order not found' });

    // If order was marked preparing or ready, broadcast to riders if not assigned
    if (status === 'preparing' || status === 'ready') {
      if (!updated.rider_id) {
        await telegramService.broadcastOrderToRiders(updated);
      }
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// RIDERS & VENDORS
// ----------------------------------------------------
apiRouter.get('/riders', async (req: Request, res: Response) => {
  try {
    const riders = await db.getRiders();
    res.json(riders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/riders/:id/status', async (req: Request, res: Response) => {
  try {
    const { is_online, current_location } = req.body;
    const updated = await db.updateRiderStatus(req.params.id, is_online, current_location);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await db.getVendors();
    res.json(vendors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// MASTER ADMIN STATS & DB STATUS
// ----------------------------------------------------
apiRouter.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const orders = await db.getOrders();
    const restaurants = await db.getRestaurants();
    const riders = await db.getRiders();
    const vendors = await db.getVendors();

    const totalGMV = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
    const platformCommission = Math.round(totalGMV * 0.15); // 15% platform commission
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    res.json({
      totalOrders: orders.length,
      activeOrders,
      deliveredOrders,
      totalGMV,
      platformCommission,
      totalRestaurants: restaurants.length,
      openRestaurants: restaurants.filter(r => r.is_open).length,
      totalRiders: riders.length,
      onlineRiders: riders.filter(r => r.is_online).length,
      totalVendors: vendors.length,
      dbStatus: db.getStatus(),
      pingStats: getPingStats()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/system/db-status', (req: Request, res: Response) => {
  res.json(db.getStatus());
});

apiRouter.post('/system/db-init', async (req: Request, res: Response) => {
  try {
    const status = await initDatabase();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// TELEGRAM SIMULATOR & WEBHOOKS
// ----------------------------------------------------
apiRouter.get('/telegram/status', (req: Request, res: Response) => {
  res.json(telegramService.getBotStatus());
});

apiRouter.get('/telegram/simulator/messages', (req: Request, res: Response) => {
  const botType = req.query.bot_type as 'rider' | 'vendor' | undefined;
  res.json(getBotMessageHistory(botType));
});

apiRouter.post('/telegram/simulator/send', async (req: Request, res: Response) => {
  try {
    const { bot_type, text, user_id } = req.body;
    const result = await telegramService.handleIncomingMessage(bot_type, text, user_id || 'user-sim');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/telegram/simulator/callback', async (req: Request, res: Response) => {
  try {
    const { bot_type, callback_data, user_id } = req.body;
    const result = await telegramService.handleCallback(bot_type, callback_data, user_id || 'user-sim');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real Webhook endpoints for Telegram Bot API
apiRouter.post('/telegram/rider-bot', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    if (update.message?.text) {
      await telegramService.handleIncomingMessage('rider', update.message.text, String(update.message.chat.id));
    } else if (update.callback_query?.data) {
      await telegramService.handleCallback('rider', update.callback_query.data, String(update.callback_query.from.id));
    }
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(200);
  }
});

apiRouter.post('/telegram/vendor-bot', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    if (update.message?.text) {
      await telegramService.handleIncomingMessage('vendor', update.message.text, String(update.message.chat.id));
    } else if (update.callback_query?.data) {
      await telegramService.handleCallback('vendor', update.callback_query.data, String(update.callback_query.from.id));
    }
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(200);
  }
});
