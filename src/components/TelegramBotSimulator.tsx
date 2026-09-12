import React, { useState, useEffect, useRef } from 'react';
import { TelegramMessage } from '../types';
import { api } from '../services/api';
import { 
  Bot, 
  Send, 
  Bike, 
  Store, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  RefreshCw, 
  Key, 
  MessageSquare,
  HelpCircle,
  Play
} from 'lucide-react';

interface TelegramBotSimulatorProps {
  onOpenCustomer: () => void;
  onOpenVendor: () => void;
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({
  onOpenCustomer,
  onOpenVendor
}) => {
  const [activeBot, setActiveBot] = useState<'rider' | 'vendor'>('rider');
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [botStatus, setBotStatus] = useState<any>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const [msgs, status] = await Promise.all([
        api.getBotMessages(activeBot),
        api.getTelegramStatus()
      ]);
      setMessages(msgs);
      setBotStatus(status);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeBot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    try {
      setIsSending(true);
      setInputVal('');
      await api.sendBotMessage(activeBot, text);
      await loadMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleButtonClick = async (callbackData: string) => {
    try {
      await api.sendBotCallback(activeBot, callbackData);
      await loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const quickCommands = activeBot === 'rider' ? [
    { label: '/start', text: '/start', desc: 'Initialize Rider Bot' },
    { label: '🟢 /online', text: '/online', desc: 'Go Online for Orders' },
    { label: '🔴 /offline', text: '/offline', desc: 'Go Offline' },
    { label: '💰 /earnings', text: '/earnings', desc: 'Check Earnings' },
    { label: '📦 /orders', text: '/orders', desc: 'Active Deliveries' }
  ] : [
    { label: '/start', text: '/start', desc: 'Initialize Vendor Bot' },
    { label: '🏪 /status', text: '/status', desc: 'Check Kitchen Status' },
    { label: '📊 /today', text: '/today', desc: 'Today\'s Orders Summary' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Telegram Bots Interactive Center</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    2 BOTS INTEGRATED
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  Interactive Telegram Simulator + Live Webhook Handlers for Riders & Vendors
                </p>
              </div>
            </div>

            {/* Switch Bot Tabs */}
            <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveBot('rider')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeBot === 'rider'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>1. Rider Bot (@FoodFlowRiderBot)</span>
              </button>
              <button
                onClick={() => setActiveBot('vendor')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeBot === 'vendor'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>2. Vendor Bot (@FoodFlowVendorBot)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Telegram Realistic Chat Client Simulator (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[640px]">
            
            {/* Telegram App Header Bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-slate-950 ${
                  activeBot === 'rider' ? 'bg-sky-400' : 'bg-amber-400'
                }`}>
                  {activeBot === 'rider' ? <Bike className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                    <span>{activeBot === 'rider' ? 'FoodFlow Rider Bot' : 'FoodFlow Vendor Kitchen Bot'}</span>
                    <span className="text-[10px] text-sky-400 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-800">bot</span>
                  </h3>
                  <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>online • responds instantly</span>
                  </span>
                </div>
              </div>

              <button
                onClick={loadMessages}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs"
                title="Refresh Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Telegram Messages Canvas */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-950/60 to-slate-900/60">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-slate-500 space-y-2">
                  <Bot className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs">No chat history yet. Click <b>/start</b> below to begin interaction.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 shadow-md text-xs leading-relaxed space-y-2.5 ${
                          isUser
                            ? 'bg-sky-600 text-white rounded-br-none'
                            : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-none'
                        }`}
                      >
                        {/* Message HTML Rendering */}
                        <div
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: msg.text }}
                        />

                        {/* Telegram Inline Keyboard Buttons */}
                        {msg.inlineButtons && msg.inlineButtons.length > 0 && (
                          <div className="pt-2 space-y-1.5 border-t border-slate-700/50">
                            {msg.inlineButtons.map((row, rowIdx) => (
                              <div key={rowIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {row.map((btn, btnIdx) => (
                                  <button
                                    key={btnIdx}
                                    onClick={() => handleButtonClick(btn.callbackData)}
                                    className="w-full py-2 px-3 bg-slate-900/90 hover:bg-sky-600 hover:text-white text-sky-300 font-bold rounded-xl border border-sky-500/30 text-[11px] transition-all text-center flex items-center justify-center space-x-1 shadow-sm active:scale-98"
                                  >
                                    <span>{btn.text}</span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                        <span className={`text-[9px] block text-right font-mono ${isUser ? 'text-sky-200' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Command Suggestions Chips */}
            <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/80 flex space-x-1.5 overflow-x-auto no-scrollbar">
              {quickCommands.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(cmd.text)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-300 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors border border-slate-700/60"
                >
                  {cmd.label}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
              <input
                id="telegram-simulator-input"
                type="text"
                placeholder={activeBot === 'rider' ? 'Send a rider command (e.g. /start, /online, /earnings)...' : 'Send a vendor command (e.g. /start, /status, /today)...'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                id="telegram-simulator-send-btn"
                onClick={() => handleSendMessage()}
                disabled={isSending || !inputVal.trim()}
                className="p-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* RIGHT: Live Workflow Instructions & Webhook Config (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Testing Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>How to Test Full Real-Time Flow:</span>
              </h3>

              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>
                  Go to <b>Customer Website</b> and place an order (e.g., Sultan's Kacchi Biryani).
                </li>
                <li>
                  Switch back to <b>Vendor Bot</b> &rarr; You will immediately see the incoming order alert with <code>[✅ Accept (15 mins)]</code> and <code>[❌ Reject]</code> buttons!
                </li>
                <li>
                  Click <b>Accept Order</b> &rarr; It triggers a dispatch broadcast to the <b>Rider Bot</b> with pickup & customer address.
                </li>
                <li>
                  Switch to <b>Rider Bot</b> &rarr; Click <code>[⚡ Accept Delivery Job]</code> &rarr; then <code>[📦 Picked Up]</code> &rarr; then <code>[✅ Delivered]</code>!
                </li>
                <li>
                  Check the Customer's <b>Live Order Tracker</b> to verify the real-time synced timeline.
                </li>
              </ol>

              <div className="pt-2 flex space-x-2">
                <button
                  onClick={onOpenCustomer}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md text-center"
                >
                  🛒 Place Order on Customer Web
                </button>
                <button
                  onClick={onOpenVendor}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 text-center"
                >
                  🍳 Open Vendor Web
                </button>
              </div>
            </div>

            {/* Real Telegram Webhook Setup Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-white">Connect Real Telegram Bots:</h3>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-200">1. Rider Bot Token:</span>
                    <span className="font-mono text-amber-400">{botStatus?.riderBotTokenPrefix || 'TELEGRAM_RIDER_BOT_TOKEN'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Webhook: <code>{botStatus?.webhookBaseUrl}/api/telegram/rider-bot</code></p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-200">2. Vendor Bot Token:</span>
                    <span className="font-mono text-amber-400">{botStatus?.vendorBotTokenPrefix || 'TELEGRAM_VENDOR_BOT_TOKEN'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Webhook: <code>{botStatus?.webhookBaseUrl}/api/telegram/vendor-bot</code></p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Add these tokens in your Render Environment Variables. The server automatically routes Telegram updates to these endpoints.
              </p>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
};
