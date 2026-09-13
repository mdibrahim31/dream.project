import { BotMessage } from '../src/types';

// In-memory message store for Telegram simulator
let botMessages: BotMessage[] = [
  {
    id: 'msg-1',
    botType: 'rider',
    chatId: 'rider-1',
    sender: 'bot',
    text: '🤖 <b>Welcome to FoodFlow Rider Dispatch Bot!</b>\n\nSend <code>/start</code> or <code>/online</code> to start receiving delivery jobs.',
    timestamp: new Date().toISOString()
  },
  {
    id: 'msg-2',
    botType: 'vendor',
    chatId: 'vendor-1',
    sender: 'bot',
    text: '👨‍🍳 <b>Welcome to FoodFlow Vendor Kitchen Bot!</b>\n\nYou will receive instant alerts for new orders. Send <code>/start</code> or <code>/status</code>.',
    timestamp: new Date().toISOString()
  }
];

export function getBotMessages(botType?: 'rider' | 'vendor', chatId?: string): BotMessage[] {
  let filtered = botMessages;
  if (botType) filtered = filtered.filter(m => m.botType === botType);
  if (chatId) filtered = filtered.filter(m => m.chatId === chatId);
  return filtered;
}

export function addBotMessage(msg: Omit<BotMessage, 'id' | 'timestamp'>): BotMessage {
  const newMsg: BotMessage = {
    ...msg,
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString()
  };
  botMessages.push(newMsg);
  return newMsg;
}

export async function handleIncomingTelegramMessage(botType: 'rider' | 'vendor', chatId: string, text: string, db: any): Promise<BotMessage[]> {
  // Add user message
  addBotMessage({
    botType,
    chatId,
    sender: 'user',
    text
  });

  const cleanText = text.trim().toLowerCase();

  if (botType === 'rider') {
    if (cleanText === '/start' || cleanText === 'hi' || cleanText === 'hello') {
      addBotMessage({
        botType: 'rider',
        chatId,
        sender: 'bot',
        text: 'Welcome to our future',
        inlineButtons: [[{ text: '🟢 Go Online', callbackData: 'rider_online' }, { text: '📊 Earnings', callbackData: 'rider_earnings' }]]
      });
    } else if (cleanText.includes('online') || cleanText === '/online') {
      const riders = await db.getRiders();
      if (riders[0]) await db.updateRiderStatus(riders[0].id, true);
      addBotMessage({
        botType: 'rider',
        chatId,
        sender: 'bot',
        text: '🟢 <b>You are now ONLINE!</b>\nYou will receive instant delivery dispatch alerts here.'
      });
    } else if (cleanText.includes('offline') || cleanText === '/offline') {
      const riders = await db.getRiders();
      if (riders[0]) await db.updateRiderStatus(riders[0].id, false);
      addBotMessage({
        botType: 'rider',
        chatId,
        sender: 'bot',
        text: '🔴 <b>You are now OFFLINE.</b>'
      });
    } else if (cleanText.includes('earnings') || cleanText === '/earnings') {
      addBotMessage({
        botType: 'rider',
        chatId,
        sender: 'bot',
        text: '📊 <b>Rider Performance & Earnings</b>\n\n👤 Rider: Tanvir Ahmed\n⭐ Rating: 4.9 / 5.0\n📦 Total Delivered: 142 orders\n💰 Total Earnings: ৳11,360'
      });
    } else if (cleanText.includes('orders') || cleanText === '/orders') {
      const orders = await db.getOrders();
      const active = orders.find((o: any) => o.status === 'out_for_delivery' || o.status === 'preparing');
      if (!active) {
        addBotMessage({
          botType: 'rider',
          chatId,
          sender: 'bot',
          text: 'ℹ️ No active delivery assigned right now. Stand by!'
        });
      } else {
        addBotMessage({
          botType: 'rider',
          chatId,
          sender: 'bot',
          text: `🛵 <b>Active Delivery: #${active.id}</b>\nRestaurant: ${active.restaurant_name}\nCustomer: ${active.customer_name} (${active.customer_phone})\nAddress: ${active.delivery_address}`,
          inlineButtons: [[{ text: '✅ Mark Delivered', callbackData: `rider_delivered:${active.id}` }]]
        });
      }
    } else {
      addBotMessage({
        botType: 'rider',
        chatId,
        sender: 'bot',
        text: `🤖 Command received: "${text}". Send <code>/start</code> or <code>/online</code>.`
      });
    }
  } else if (botType === 'vendor') {
    if (cleanText === '/start' || cleanText === 'hi' || cleanText === 'hello') {
      addBotMessage({
        botType: 'vendor',
        chatId,
        sender: 'bot',
        text: '👨‍🍳 <b>FoodFlow Vendor Kitchen Bot</b>\n\nYou will receive instant alerts for new orders placed at your restaurant.',
        inlineButtons: [[{ text: '🏪 Shop Status', callbackData: 'vendor_status' }, { text: '📈 Today Summary', callbackData: 'vendor_today' }]]
      });
    } else if (cleanText.includes('status') || cleanText === '/status') {
      const rests = await db.getRestaurants();
      const r = rests[0];
      addBotMessage({
        botType: 'vendor',
        chatId,
        sender: 'bot',
        text: `🏪 <b>Restaurant Status:</b>\nName: ${r?.name || "Sultans Dine"}\nStatus: ${r?.is_open ? '🟢 OPEN' : '🔴 CLOSED'}`
      });
    } else if (cleanText.includes('today') || cleanText === '/today') {
      const orders = await db.getOrders();
      addBotMessage({
        botType: 'vendor',
        chatId,
        sender: 'bot',
        text: `📈 <b>Today's Kitchen Summary:</b>\nTotal Orders: ${orders.length}\nActive: ${orders.filter((o: any) => o.status !== 'delivered').length}`
      });
    } else {
      addBotMessage({
        botType: 'vendor',
        chatId,
        sender: 'bot',
        text: `🤖 Kitchen message received: "${text}". Send <code>/start</code>.`
      });
    }
  }

  return getBotMessages(botType, chatId);
}
