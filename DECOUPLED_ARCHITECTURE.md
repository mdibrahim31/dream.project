# FoodFlow - Decoupled Architecture Documentation

This project is built using a **100% Decoupled Architecture** separating the Central Backend from 3 independent Frontend Applications and 2 Telegram Bot Webhook Services.

---

## 🏛️ System Architecture Overview

```
                               ┌────────────────────────────────────────┐
                               │       Supabase (PostgreSQL DB)         │
                               └───────────────────▲────────────────────┘
                                                   │
                                                   │ (Real-time DB connection / auto-migration)
                                                   ▼
                     ┌────────────────────────────────────────────────────────┐
                     │          Central Backend API (Node.js / Express)       │
                     │          • Hosted on Render                            │
                     │          • Single Port / Server                        │
                     │          • Endpoints: /api/*                           │
                     │          • 24/7 Keep-Alive: /api/ping                  │
                     └───────▲──────────────▲──────────────▲────────────▲─────┘
                             │              │              │            │
            ┌────────────────┴───┐   ┌──────┴──────────┐   │            │
            │                    │   │                 │   │            │
            ▼                    ▼   ▼                 ▼   ▼            ▼
   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────────┐
   │  customer-app   │  │   vendor-app    │  │    admin-app    │  │       Telegram Bots       │
   │  (Domain 1)     │  │   (Domain 2)    │  │   (Domain 3)    │  │  1. Vendor Bot Webhook    │
   │                 │  │                 │  │                 │  │     (/api/telegram/vendor)│
   │  • Browse Food  │  │  • Kitchen Board│  │  • Master Stats │  │  2. Rider Bot Webhook     │
   │  • Menu Filter  │  │  • Accept/Reject│  │  • GMV & Comm.  │  │     (/api/telegram/rider) │
   │  • Basket & Pay │  │  • Menu Editor  │  │  • Rider Fleet  │  │                           │
   │  • Live Status  │  │  • Shop Open/Cls│  │  • Supabase Mgr │  │                           │
   └─────────────────┘  └─────────────────┘  └─────────────────┘  └───────────────────────────┘
```

---

## 📁 Decoupled Folder Structure

```
├── server/                        # ⚡ Central Backend (Node.js/Express)
│   ├── server.ts                  # Central Express Server (Port 3000 / Render)
│   ├── db.ts                      # Supabase PostgreSQL + Auto-Migration Engine
│   ├── routes.ts                  # REST API Endpoints (/api/restaurants, /api/orders, etc.)
│   ├── telegram.ts                # Telegram Webhook Handlers (@FoodFlowVendorBot, @FoodFlowRiderBot)
│   └── ping.ts                    # 24/7 Render Keep-Alive / Heartbeat Engine
│
├── customer-app/                  # 🍔 Customer Frontend (Domain 1: e.g. foodflow.com)
│   ├── package.json               # Independent package & scripts
│   └── src/
│       ├── App.tsx                # Standalone Customer UI (No vendor/admin code)
│       ├── types.ts               # Isolated customer types
│       └── services/api.ts        # Connects to central backend via VITE_API_BASE_URL
│
├── vendor-app/                    # 🍳 Vendor Kitchen Dashboard (Domain 2: e.g. vendor.foodflow.com)
│   ├── package.json               # Independent package & scripts
│   └── src/
│       ├── App.tsx                # Standalone Vendor Kitchen UI
│       ├── types.ts               # Isolated vendor types
│       └── services/api.ts        # Connects to central backend via VITE_API_BASE_URL
│
├── admin-app/                     # 🛡️ Platform Super Admin (Domain 3: e.g. admin.foodflow.com)
│   ├── package.json               # Independent package & scripts
│   └── src/
│       ├── App.tsx                # Standalone Admin UI (GMV, 15% commission, fleet)
│       ├── types.ts               # Isolated admin types
│       └── services/api.ts        # Connects to central backend via VITE_API_BASE_URL
```

---

## 🚀 Independent Deployment Guide

### 1. Central Backend (Render)
- **Repo Root Directory**: `/` (or `server/`)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `SUPABASE_DATABASE_URL`: `postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres`
  - `TELEGRAM_BOT_TOKEN_RIDER`: Your Rider Bot Token from @BotFather
  - `TELEGRAM_BOT_TOKEN_VENDOR`: Your Vendor Bot Token from @BotFather
  - `TELEGRAM_WEBHOOK_URL`: `https://your-api.onrender.com/api/telegram`

### 2. Customer App (Vercel / Netlify / Firebase)
- **Root Directory**: `customer-app/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://your-api.onrender.com`

### 3. Vendor App (Vercel / Netlify)
- **Root Directory**: `vendor-app/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://your-api.onrender.com`

### 4. Admin App (Vercel / Netlify)
- **Root Directory**: `admin-app/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://your-api.onrender.com`

---

## 🤖 Telegram Bot Webhook URLs
- **Rider Bot**: `POST https://your-api.onrender.com/api/telegram/rider-bot`
- **Vendor Bot**: `POST https://your-api.onrender.com/api/telegram/vendor-bot`
