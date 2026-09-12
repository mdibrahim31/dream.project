import { db, Order, Rider, Vendor } from './db.js';

export interface TelegramMessage {
  id: string;
  botType: 'rider' | 'vendor';
  chatId: string;
  sender: 'bot' | 'user';
  text: string;
  inlineButtons?: { text: string; callbackData: string }[][];
  timestamp: string;
}

// In-memory message history for UI Simulator & live events
const messageHistory: TelegramMessage[] = [];
const eventListeners: ((msg: TelegramMessage) => void)[] = [];

export function addBotMessage(msg: Omit<TelegramMessage, 'id' | 'timestamp'>) {
  const fullMsg: TelegramMessage = {
    ...msg,
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  messageHistory.push(fullMsg);
  if (messageHistory.length > 200) messageHistory.shift();

  // Notify listeners
  eventListeners.forEach(listener => {
    try {
      listener(fullMsg);
    } catch (e) {
      console.error('Listener err:', e);
    }
  });

  return fullMsg;
}

export function getBotMessageHistory(botType?: 'rider' | 'vendor', limit = 50) {
  if (botType) {
    return messageHistory.filter(m => m.botType === botType).slice(-limit);
  }
  return messageHistory.slice(-limit);
}

// Real Telegram API Sender (when tokens are present)
async function sendRealTelegramMessage(token: string, chatId: string, text: string, replyMarkup?: any) {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn(`[Telegram API Error]: Could not send to ${chatId}:`, err.message);
    return null;
  }
}

// Telegram Service Functions
export const telegramService = {
  getBotStatus() {
    return {
      riderBotConfigured: Boolean(process.env.TELEGRAM_RIDER_BOT_TOKEN),
      vendorBotConfigured: Boolean(process.env.TELEGRAM_VENDOR_BOT_TOKEN),
      riderBotTokenPrefix: process.env.TELEGRAM_RIDER_BOT_TOKEN ? `${process.env.TELEGRAM_RIDER_BOT_TOKEN.substring(0, 6)}...` : 'Not set',
      vendorBotTokenPrefix: process.env.TELEGRAM_VENDOR_BOT_TOKEN ? `${process.env.TELEGRAM_VENDOR_BOT_TOKEN.substring(0, 6)}...` : 'Not set',
      webhookBaseUrl: process.env.APP_URL || 'http://localhost:3000'
    };
  },

  // Notify Vendor about new order
  async notifyVendorNewOrder(order: Order) {
    const itemsList = order.items.map(i => `• ${i.quantity}x ${i.name} (৳${i.price * i.quantity})`).join('\n');
    const text = `🔔 <b>NEW ORDER RECEIVED!</b>\n\n` +
      `<b>Order ID:</b> #${order.id}\n` +
      `<b>Customer:</b> ${order.customer_name} (${order.customer_phone})\n` +
      `<b>Address:</b> ${order.delivery_address}\n\n` +
      `<b>Items:</b>\n${itemsList}\n\n` +
      `<b>Total Amount:</b> ৳${order.total} (${order.payment_method.toUpperCase()})\n` +
      `<i>Tap an action below:</i>`;

    const buttons = [
      [
        { text: '✅ Accept (15 mins)', callbackData: `vendor_accept:${order.id}:15` },
        { text: '✅ Accept (30 mins)', callbackData: `vendor_accept:${order.id}:30` }
      ],
      [
        { text: '❌ Reject Order', callbackData: `vendor_reject:${order.id}` }
      ]
    ];

    addBotMessage({
      botType: 'vendor',
      chatId: 'vendor-channel',
      sender: 'bot',
      text,
      inlineButtons: buttons
    });

    const token = process.env.TELEGRAM_VENDOR_BOT_TOKEN;
    if (token) {
      const vendors = await db.getVendors();
      const targetVendor = vendors.find(v => v.restaurant_id === order.restaurant_id);
      if (targetVendor?.telegram_chat_id) {
        await sendRealTelegramMessage(token, targetVendor.telegram_chat_id, text, {
          inline_keyboard: buttons.map(row => row.map(b => ({ text: b.text, callback_data: b.callbackData })))
        });
      }
    }
  },

  // Broadcast to available Riders when order is preparing/ready
  async broadcastOrderToRiders(order: Order) {
    const text = `🛵 <b>DELIVERY JOB AVAILABLE!</b>\n\n` +
      `<b>Order:</b> #${order.id}\n` +
      `<b>Pickup From:</b> ${order.restaurant_name}\n` +
      `<b>Drop-off:</b> ${order.delivery_address}\n` +
      `<b>Earnings / Fee:</b> ৳${order.delivery_fee} + Tips\n` +
      `<b>Items Count:</b> ${order.items.length} items\n` +
      `<b>Payment:</b> ${order.payment_method.toUpperCase()} (Collect ৳${order.total})`;

    const buttons = [
      [
        { text: '⚡ Accept Delivery Job', callbackData: `rider_accept:${order.id}` }
      ]
    ];

    addBotMessage({
      botType: 'rider',
      chatId: 'rider-fleet',
      sender: 'bot',
      text,
      inlineButtons: buttons
    });

    const token = process.env.TELEGRAM_RIDER_BOT_TOKEN;
    if (token) {
      const riders = await db.getRiders();
      const onlineRiders = riders.filter(r => r.is_online && r.status === 'available' && r.telegram_chat_id);
      for (const r of onlineRiders) {
        if (r.telegram_chat_id) {
          await sendRealTelegramMessage(token, r.telegram_chat_id, text, {
            inline_keyboard: buttons.map(row => row.map(b => ({ text: b.text, callback_data: b.callbackData })))
          });
        }
      }
    }
  },

  // Handle incoming telegram callback query or simulator button tap
  async handleCallback(botType: 'rider' | 'vendor', callbackData: string, userId: string = 'user-sim') {
    const [action, ...args] = callbackData.split(':');

    if (botType === 'vendor') {
      if (action === 'vendor_accept') {
        const orderId = args[0];
        const prepTime = args[1] || '20';
        const order = await db.getOrderById(orderId);
        if (order) {
          await db.updateOrderStatus(orderId, 'preparing');
          const replyText = `✅ Order #${orderId} accepted! Estimated prep time: ${prepTime} mins.\nOrder is now marked as PREPARING in the kitchen.`;
          addBotMessage({
            botType: 'vendor',
            chatId: userId,
            sender: 'bot',
            text: replyText,
            inlineButtons: [
              [{ text: '🍲 Mark Ready for Pickup', callbackData: `vendor_ready:${orderId}` }]
            ]
          });
          // Broadcast to riders
          await this.broadcastOrderToRiders(order);
          return { success: true, message: replyText };
        }
      } else if (action === 'vendor_ready') {
        const orderId = args[0];
        await db.updateOrderStatus(orderId, 'ready');
        const replyText = `🍲 Order #${orderId} is READY! Notified nearby riders for immediate pickup.`;
        addBotMessage({
          botType: 'vendor',
          chatId: userId,
          sender: 'bot',
          text: replyText
        });
        return { success: true, message: replyText };
      } else if (action === 'vendor_reject') {
        const orderId = args[0];
        await db.updateOrderStatus(orderId, 'cancelled');
        const replyText = `❌ Order #${orderId} has been rejected. Customer has been notified.`;
        addBotMessage({
          botType: 'vendor',
          chatId: userId,
          sender: 'bot',
          text: replyText
        });
        return { success: true, message: replyText };
      }
    }

    if (botType === 'rider') {
      if (action === 'rider_accept') {
        const orderId = args[0];
        const order = await db.getOrderById(orderId);
        if (!order) return { success: false, message: 'Order not found' };
        if (order.rider_id && order.rider_id !== 'rider-1') {
          const replyText = `⚠️ Sorry, this delivery job was already accepted by another rider!`;
          addBotMessage({ botType: 'rider', chatId: userId, sender: 'bot', text: replyText });
          return { success: false, message: replyText };
        }

        const rider = (await db.getRiders())[0] || { id: 'rider-1', name: 'Tanvir Ahmed', phone: '+880 1712-889900' };
        await db.updateOrderStatus(orderId, 'accepted', {
          rider_id: rider.id,
          rider_name: rider.name,
          rider_phone: rider.phone
        });

        const replyText = `🎉 <b>You accepted delivery for Order #${orderId}!</b>\n\n` +
          `📍 <b>Pickup:</b> ${order.restaurant_name}\n` +
          `🏠 <b>Delivery to:</b> ${order.customer_name} at ${order.delivery_address}\n` +
          `📞 <b>Customer Tel:</b> ${order.customer_phone}\n\n` +
          `Please proceed to the restaurant.`;

        const buttons = [
          [{ text: '📦 Picked Up from Restaurant', callbackData: `rider_pickup:${orderId}` }]
        ];

        addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: replyText,
          inlineButtons: buttons
        });
        return { success: true, message: replyText };
      } else if (action === 'rider_pickup') {
        const orderId = args[0];
        await db.updateOrderStatus(orderId, 'out_for_delivery');
        const replyText = `🛵 <b>Order #${orderId} Picked Up!</b>\nNow heading to customer location. Live tracker updated for customer.`;
        const buttons = [
          [{ text: '✅ Delivered to Customer', callbackData: `rider_delivered:${orderId}` }]
        ];
        addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: replyText,
          inlineButtons: buttons
        });
        return { success: true, message: replyText };
      } else if (action === 'rider_delivered') {
        const orderId = args[0];
        const order = await db.getOrderById(orderId);
        await db.updateOrderStatus(orderId, 'delivered');
        const replyText = `🎊 <b>Delivery Completed for Order #${orderId}!</b>\nEarnings added: ৳${order?.delivery_fee || 50}. Great job!`;
        addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: replyText
        });
        return { success: true, message: replyText };
      }
    }

    return { success: true, message: 'Processed' };
  },

  // Handle incoming text commands (/start, /status, /earnings, etc.)
  async handleIncomingMessage(botType: 'rider' | 'vendor', text: string, userId: string = 'user-sim') {
    // Record user message
    addBotMessage({
      botType,
      chatId: userId,
      sender: 'user',
      text
    });

    const cleanText = text.trim().toLowerCase();

    if (botType === 'rider') {
      if (cleanText === '/start') {
        const replyText = `Welcome to our future`;

        const buttons = [
          [
            { text: '🟢 Go Online', callbackData: 'rider_cmd:online' },
            { text: '🔴 Go Offline', callbackData: 'rider_cmd:offline' }
          ],
          [
            { text: '💰 View Earnings', callbackData: 'rider_cmd:earnings' },
            { text: '📦 Active Orders', callbackData: 'rider_cmd:orders' }
          ]
        ];

        const token = process.env.TELEGRAM_RIDER_BOT_TOKEN;
        if (token && userId && !userId.startsWith('user-sim')) {
          sendRealTelegramMessage(token, userId, replyText, {
            inline_keyboard: buttons.map(row => row.map(b => ({ text: b.text, callback_data: b.callbackData })))
          }).catch(() => {});
        }

        return addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: replyText,
          inlineButtons: buttons
        });
      }

      if (cleanText === 'hi' || cleanText === 'hello') {
        const replyText = `Welcome to our future`;
        return addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: replyText
        });
      }

      if (cleanText === '/online' || cleanText.includes('online')) {
        const riders = await db.getRiders();
        if (riders[0]) await db.updateRiderStatus(riders[0].id, true);
        return addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: `🟢 <b>You are now ONLINE!</b>\nYou will receive instant notifications whenever a customer places an order nearby.`
        });
      }

      if (cleanText === '/offline' || cleanText.includes('offline')) {
        const riders = await db.getRiders();
        if (riders[0]) await db.updateRiderStatus(riders[0].id, false);
        return addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: `🔴 <b>You are now OFFLINE.</b>\nEnjoy your break. Send <code>/online</code> when you are ready to ride again.`
        });
      }

      if (cleanText === '/earnings' || cleanText.includes('earning')) {
        const riders = await db.getRiders();
        const rider = riders[0];
        const textResp = `📊 <b>Rider Performance & Earnings</b>\n\n` +
          `👤 Rider: ${rider?.name || 'Tanvir Ahmed'}\n` +
          `⭐ Rating: 4.9 / 5.0\n` +
          `📦 Total Completed: ${rider?.total_deliveries || 142} deliveries\n` +
          `💰 Total Earnings: ৳${rider?.total_earnings || 11360}\n` +
          `💵 Today's Earnings: ৳850 (11 trips)`;
        return addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: textResp
        });
      }

      if (cleanText === '/orders' || cleanText.includes('order')) {
        const orders = await db.getOrders({ status: 'out_for_delivery' });
        if (orders.length === 0) {
          return addBotMessage({
            botType: 'rider',
            chatId: userId,
            sender: 'bot',
            text: `ℹ️ No active delivery assigned right now. Stand by for new orders!`
          });
        }
        const o = orders[0];
        return addBotMessage({
          botType: 'rider',
          chatId: userId,
          sender: 'bot',
          text: `🛵 Active Delivery: #${o.id}\nRestaurant: ${o.restaurant_name}\nCustomer: ${o.customer_name} (${o.customer_phone})\nAddress: ${o.delivery_address}`,
          inlineButtons: [[{ text: '✅ Delivered', callbackData: `rider_delivered:${o.id}` }]]
        });
      }
    }

    if (botType === 'vendor') {
      if (cleanText === '/start' || cleanText === 'hi' || cleanText === 'hello') {
        const replyText = `👨‍🍳 <b>Welcome to FoodFlow Vendor Bot!</b>\n\n` +
          `You will receive instant alerts for every new order placed at your restaurant.\n\n` +
          `<b>Commands:</b>\n` +
          `• <code>/status</code> - Check shop open/close status\n` +
          `• <code>/today</code> - Summary of today's kitchen orders\n` +
          `• <code>/toggle</code> - Toggle shop open/closed`;

        const buttons = [
          [
            { text: '🏪 Check Shop Status', callbackData: 'vendor_cmd:status' },
            { text: '📊 Today\'s Orders', callbackData: 'vendor_cmd:today' }
          ]
        ];

        return addBotMessage({
          botType: 'vendor',
          chatId: userId,
          sender: 'bot',
          text: replyText,
          inlineButtons: buttons
        });
      }

      if (cleanText === '/status' || cleanText.includes('status')) {
        const rests = await db.getRestaurants();
        const r = rests[0];
        return addBotMessage({
          botType: 'vendor',
          chatId: userId,
          sender: 'bot',
          text: `🏪 <b>Restaurant Status:</b>\nName: ${r?.name || "Sultan's Dine"}\nStatus: ${r?.is_open ? '🟢 OPEN (Receiving orders)' : '🔴 CLOSED'}\nAddress: ${r?.address}`
        });
      }

      if (cleanText === '/today' || cleanText.includes('today')) {
        const orders = await db.getOrders();
        return addBotMessage({
          botType: 'vendor',
          chatId: userId,
          sender: 'bot',
          text: `📈 <b>Today's Kitchen Summary:</b>\nTotal Orders: ${orders.length}\nCompleted: ${orders.filter(o => o.status === 'delivered').length}\nPending/Active: ${orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}`
        });
      }
    }

    // Default response
    return addBotMessage({
      botType,
      chatId: userId,
      sender: 'bot',
      text: `🤖 Command received: "${text}". Send <code>/start</code> to view all available commands.`
    });
  }
};
