import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Pool } = pg;

export interface DBConfig {
  databaseUrl?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  rating: number;
  delivery_time: string;
  min_order: number;
  delivery_fee: number;
  image_url: string;
  banner_url: string;
  is_open: boolean;
  address: string;
  phone: string;
  vendor_id?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  restaurant_id?: string;
}

export interface FoodItem {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  vendor_name?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  is_popular?: boolean;
  created_at?: string;
}

export type MenuItem = FoodItem;

export interface OrderItem {
  food_id: string;
  name: string;
  price: number;
  quantity: number;
  instructions?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  restaurant_id: string;
  restaurant_name: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'online';
  payment_status: 'pending' | 'paid';
  rider_id?: string;
  rider_name?: string;
  rider_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  telegram_chat_id?: string;
  is_online: boolean;
  current_location: string;
  total_deliveries: number;
  total_earnings: number;
  status: 'available' | 'busy' | 'offline';
  rating: number;
}

export interface Vendor {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  telegram_chat_id?: string;
  email: string;
  is_active: boolean;
}

// In-Memory Seed fallback if DB URL is not yet connected
let memoryRestaurants: Restaurant[] = [
  {
    id: 'res-1',
    name: 'Sultan\'s Dine & Grill',
    slug: 'sultans-dine',
    cuisine: 'Biryani, Kacchi, Mughlai',
    rating: 4.8,
    delivery_time: '25-35 min',
    min_order: 150,
    delivery_fee: 40,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
    is_open: true,
    address: 'Plot 12, Road 7, Dhanmondi, Dhaka',
    phone: '+880 1711-223344',
    vendor_id: 'ven-1',
  },
  {
    id: 'res-2',
    name: 'Burger Craft & Co.',
    slug: 'burger-craft',
    cuisine: 'Gourmet Burgers, Fast Food, Shakes',
    rating: 4.7,
    delivery_time: '20-30 min',
    min_order: 200,
    delivery_fee: 50,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80',
    is_open: true,
    address: 'Block C, Banani 11, Dhaka',
    phone: '+880 1822-334455',
    vendor_id: 'ven-2',
  },
  {
    id: 'res-3',
    name: 'Bella Napoli Woodfired Pizza',
    slug: 'bella-napoli',
    cuisine: 'Italian, Pizza, Pasta',
    rating: 4.9,
    delivery_time: '30-40 min',
    min_order: 300,
    delivery_fee: 60,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&auto=format&fit=crop&q=80',
    is_open: true,
    address: 'Gulshan 2 Avenue, Dhaka',
    phone: '+880 1933-445566',
    vendor_id: 'ven-3',
  }
];

let memoryCategories: Category[] = [
  { id: 'cat-1', name: 'All', icon: 'Utensils' },
  { id: 'cat-2', name: 'Biryani & Rice', icon: 'Flame' },
  { id: 'cat-3', name: 'Burgers', icon: 'Sandwich' },
  { id: 'cat-4', name: 'Pizza', icon: 'Pizza' },
  { id: 'cat-5', name: 'Desserts & Drinks', icon: 'Coffee' }
];

let memoryFoodItems: FoodItem[] = [
  {
    id: 'food-1',
    restaurant_id: 'res-1',
    name: 'Special Kacchi Biryani (Basmati)',
    description: 'Tender mutton cooked with aromatic basmati rice, saffron, alu bukhara, potato & boiled egg.',
    price: 380,
    category: 'Biryani & Rice',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: true
  },
  {
    id: 'food-2',
    restaurant_id: 'res-1',
    name: 'Morog Polao with Chicken Roast',
    description: 'Traditional Dhakaiya rich polao served with succulent chicken roast, egg, and spicy gravy.',
    price: 320,
    category: 'Biryani & Rice',
    image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: true
  },
  {
    id: 'food-3',
    restaurant_id: 'res-1',
    name: 'Shahi Borhani (1 Liter)',
    description: 'Signature thick spiced yogurt beverage with mint, mustard seeds and roasted cumin.',
    price: 180,
    category: 'Desserts & Drinks',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: false
  },
  {
    id: 'food-4',
    restaurant_id: 'res-2',
    name: 'Smoky BBQ Bacon Cheeseburger',
    description: 'Charbroiled smashed beef patty, melted aged cheddar, crispy beef bacon, caramelized onions & secret BBQ sauce.',
    price: 360,
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: true
  },
  {
    id: 'food-5',
    restaurant_id: 'res-2',
    name: 'Crispy Nashville Hot Chicken Burger',
    description: 'Double-breaded spicy buttermilk chicken breast, dill pickles, vinegar slaw, and cayenne honey butter.',
    price: 340,
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: true
  },
  {
    id: 'food-6',
    restaurant_id: 'res-2',
    name: 'Loaded Truffle Parmesan Fries',
    description: 'Crispy skin-on potato fries tossed in truffle oil, fresh herbs, grated parmesan and garlic aioli.',
    price: 190,
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: false
  },
  {
    id: 'food-7',
    restaurant_id: 'res-3',
    name: 'Quattro Formaggi Pizza (12 inch)',
    description: 'Hand-stretched sourdough crust with mozzarella, gorgonzola, parmesan, ricotta & fresh basil.',
    price: 650,
    category: 'Pizza',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: true
  },
  {
    id: 'food-8',
    restaurant_id: 'res-3',
    name: 'Spicy Pepperoni & Jalapeno Pizza',
    description: 'San Marzano tomato base, generous beef pepperoni, pickled jalapenos, hot honey drizzle.',
    price: 690,
    category: 'Pizza',
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_popular: true
  }
];

let memoryRiders: Rider[] = [
  {
    id: 'rider-1',
    name: 'Tanvir Ahmed',
    phone: '+880 1712-889900',
    telegram_chat_id: '8923411',
    is_online: true,
    current_location: 'Dhanmondi 27',
    total_deliveries: 142,
    total_earnings: 11360,
    status: 'available',
    rating: 4.9
  },
  {
    id: 'rider-2',
    name: 'Rakib Hossain',
    phone: '+880 1833-112233',
    telegram_chat_id: '7461922',
    is_online: true,
    current_location: 'Gulshan 1 Circle',
    total_deliveries: 88,
    total_earnings: 7040,
    status: 'available',
    rating: 4.8
  }
];

let memoryVendors: Vendor[] = [
  {
    id: 'ven-1',
    restaurant_id: 'res-1',
    name: 'Sultan\'s Dine Manager',
    phone: '+880 1711-223344',
    telegram_chat_id: '9938411',
    email: 'vendor1@sultansdine.com',
    is_active: true
  },
  {
    id: 'ven-2',
    restaurant_id: 'res-2',
    name: 'Burger Craft Manager',
    phone: '+880 1822-334455',
    telegram_chat_id: '9938412',
    email: 'vendor2@burgercraft.com',
    is_active: true
  },
  {
    id: 'ven-3',
    restaurant_id: 'res-3',
    name: 'Bella Napoli Manager',
    phone: '+880 1933-445566',
    telegram_chat_id: '9938413',
    email: 'vendor3@bellanapoli.com',
    is_active: true
  }
];

let memoryOrders: Order[] = [
  {
    id: 'ORD-9821',
    customer_name: 'Mahmudul Hasan',
    customer_phone: '+880 1799-556677',
    delivery_address: 'House 45, Road 8/A, Dhanmondi, Dhaka',
    restaurant_id: 'res-1',
    restaurant_name: 'Sultan\'s Dine & Grill',
    items: [
      { food_id: 'food-1', name: 'Special Kacchi Biryani (Basmati)', price: 380, quantity: 2 },
      { food_id: 'food-3', name: 'Shahi Borhani (1 Liter)', price: 180, quantity: 1 }
    ],
    subtotal: 940,
    delivery_fee: 40,
    total: 980,
    status: 'preparing',
    payment_method: 'cod',
    payment_status: 'pending',
    rider_id: 'rider-1',
    rider_name: 'Tanvir Ahmed',
    rider_phone: '+880 1712-889900',
    notes: 'Please add extra salad and tissue.',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    estimated_delivery_time: '20 mins'
  }
];

let pool: pg.Pool | null = null;
let isConnectedToPostgres = false;
let dbInitStatus = {
  initialized: false,
  usingPostgres: false,
  tablesCreated: [] as string[],
  bucketCreated: false,
  error: null as string | null,
  lastChecked: new Date().toISOString()
};

// SQL Schema for Supabase Auto Creation
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS restaurants (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  cuisine VARCHAR(255),
  rating NUMERIC(3, 2) DEFAULT 4.5,
  delivery_time VARCHAR(50) DEFAULT '30 min',
  min_order NUMERIC(10, 2) DEFAULT 0,
  delivery_fee NUMERIC(10, 2) DEFAULT 40,
  image_url TEXT,
  banner_url TEXT,
  is_open BOOLEAN DEFAULT true,
  address TEXT,
  phone VARCHAR(50),
  vendor_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Utensils',
  restaurant_id VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS food_items (
  id VARCHAR(64) PRIMARY KEY,
  restaurant_id VARCHAR(64) REFERENCES restaurants(id) ON DELETE CASCADE,
  restaurant_name VARCHAR(255),
  vendor_name VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(64) PRIMARY KEY,
  restaurant_id VARCHAR(64) REFERENCES restaurants(id) ON DELETE CASCADE,
  restaurant_name VARCHAR(255),
  vendor_name VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist if table was previously created
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS restaurant_name VARCHAR(255);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS restaurant_name VARCHAR(255);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);

CREATE TABLE IF NOT EXISTS riders (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  telegram_chat_id VARCHAR(100),
  is_online BOOLEAN DEFAULT false,
  current_location VARCHAR(255),
  total_deliveries INTEGER DEFAULT 0,
  total_earnings NUMERIC(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'available',
  rating NUMERIC(3, 2) DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(64) PRIMARY KEY,
  restaurant_id VARCHAR(64) REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  telegram_chat_id VARCHAR(100),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  restaurant_id VARCHAR(64) REFERENCES restaurants(id),
  restaurant_name VARCHAR(255),
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'placed',
  payment_method VARCHAR(50) DEFAULT 'cod',
  payment_status VARCHAR(50) DEFAULT 'pending',
  rider_id VARCHAR(64),
  rider_name VARCHAR(255),
  rider_phone VARCHAR(50),
  notes TEXT,
  estimated_delivery_time VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_logs (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(50),
  event VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

export async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔄 Initializing Database Layer...');

  if (dbUrl) {
    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      const client = await pool.connect();
      console.log('✅ Connected to PostgreSQL / Supabase successfully!');

      // Run DDL to create tables
      await client.query(SCHEMA_SQL);
      console.log('✅ Auto-created required PostgreSQL tables & indexes!');
      client.release();

      isConnectedToPostgres = true;
      dbInitStatus = {
        initialized: true,
        usingPostgres: true,
        tablesCreated: ['restaurants', 'categories', 'food_items', 'riders', 'vendors', 'orders', 'system_logs'],
        bucketCreated: false,
        error: null,
        lastChecked: new Date().toISOString()
      };

      // Seed initial data if tables are empty
      await seedInitialPostgresData();
    } catch (err: any) {
      console.warn('⚠️ PostgreSQL connection failed, falling back to instant in-memory storage:', err.message);
      isConnectedToPostgres = false;
      dbInitStatus = {
        initialized: true,
        usingPostgres: false,
        tablesCreated: ['in-memory-restaurants', 'in-memory-food-items', 'in-memory-orders', 'in-memory-riders', 'in-memory-vendors'],
        bucketCreated: false,
        error: `PostgreSQL connection error: ${err.message}. Seamlessly running in active in-memory store.`,
        lastChecked: new Date().toISOString()
      };
    }
  } else {
    console.log('ℹ️ No DATABASE_URL found in environment. Running in-memory database with pre-seeded demo items.');
    dbInitStatus = {
      initialized: true,
      usingPostgres: false,
      tablesCreated: ['in-memory-restaurants', 'in-memory-food-items', 'in-memory-orders', 'in-memory-riders', 'in-memory-vendors'],
      bucketCreated: false,
      error: 'DATABASE_URL variable not set. Please add DATABASE_URL in Render environment variables to connect directly to Supabase.',
      lastChecked: new Date().toISOString()
    };
  }

  // Check Supabase Storage Bucket auto-creation
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (!error) {
        const bucketName = 'food-delivery-assets';
        const exists = buckets?.some(b => b.name === bucketName);
        if (!exists) {
          await supabase.storage.createBucket(bucketName, { public: true });
          console.log(`✅ Auto-created Supabase Storage bucket: "${bucketName}"`);
        }
        dbInitStatus.bucketCreated = true;
      }
    } catch (storageErr: any) {
      console.warn('⚠️ Supabase Storage initialization note:', storageErr.message);
    }
  }

  return dbInitStatus;
}

async function seedInitialPostgresData() {
  if (!pool) return;
  try {
    const res = await pool.query('SELECT count(*) FROM restaurants');
    if (parseInt(res.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial restaurant & menu records into PostgreSQL...');
      for (const r of memoryRestaurants) {
        await pool.query(
          `INSERT INTO restaurants (id, name, slug, cuisine, rating, delivery_time, min_order, delivery_fee, image_url, banner_url, is_open, address, phone, vendor_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.name, r.slug, r.cuisine, r.rating, r.delivery_time, r.min_order, r.delivery_fee, r.image_url, r.banner_url, r.is_open, r.address, r.phone, r.vendor_id]
        );
      }
      for (const f of memoryFoodItems) {
        await pool.query(
          `INSERT INTO food_items (id, restaurant_id, name, description, price, category, image_url, is_available, is_popular)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [f.id, f.restaurant_id, f.name, f.description, f.price, f.category, f.image_url, f.is_available, f.is_popular]
        );
      }
      for (const c of memoryCategories) {
        await pool.query(
          `INSERT INTO categories (id, name, icon) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
          [c.id, c.name, c.icon]
        );
      }
      for (const rd of memoryRiders) {
        await pool.query(
          `INSERT INTO riders (id, name, phone, telegram_chat_id, is_online, current_location, total_deliveries, total_earnings, status, rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [rd.id, rd.name, rd.phone, rd.telegram_chat_id, rd.is_online, rd.current_location, rd.total_deliveries, rd.total_earnings, rd.status, rd.rating]
        );
      }
      for (const v of memoryVendors) {
        await pool.query(
          `INSERT INTO vendors (id, restaurant_id, name, phone, telegram_chat_id, email, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [v.id, v.restaurant_id, v.name, v.phone, v.telegram_chat_id, v.email, v.is_active]
        );
      }
      console.log('✅ PostgreSQL seeding complete!');
    }
  } catch (seedErr: any) {
    console.warn('⚠️ Seeding error:', seedErr.message);
  }
}

// Data Access Methods (Universal abstraction over PG / In-Memory)
export const db = {
  getStatus: () => ({ ...dbInitStatus, isConnected: isConnectedToPostgres }),

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    if (isConnectedToPostgres && pool) {
      try {
        const res = await pool.query('SELECT * FROM restaurants ORDER BY name ASC');
        return res.rows;
      } catch (err) {
        console.error('PG getRestaurants error:', err);
      }
    }
    return memoryRestaurants;
  },

  async getRestaurantById(id: string): Promise<Restaurant | undefined> {
    if (isConnectedToPostgres && pool) {
      try {
        const res = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
        return res.rows[0];
      } catch (err) {
        console.error('PG getRestaurantById error:', err);
      }
    }
    return memoryRestaurants.find(r => r.id === id);
  },

  async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<Restaurant | undefined> {
    if (isConnectedToPostgres && pool) {
      try {
        const current = await this.getRestaurantById(id);
        if (!current) return undefined;
        const updated = { ...current, ...updates };
        await pool.query(
          `UPDATE restaurants SET name=$1, cuisine=$2, is_open=$3, phone=$4, address=$5, delivery_fee=$6, delivery_time=$7 WHERE id=$8`,
          [updated.name, updated.cuisine, updated.is_open, updated.phone, updated.address, updated.delivery_fee, updated.delivery_time, id]
        );
        return updated;
      } catch (err) {
        console.error('PG updateRestaurant error:', err);
      }
    }
    const idx = memoryRestaurants.findIndex(r => r.id === id);
    if (idx !== -1) {
      memoryRestaurants[idx] = { ...memoryRestaurants[idx], ...updates };
      return memoryRestaurants[idx];
    }
    return undefined;
  },

  // Food Items / Menu Items
  async getFoodItems(restaurantId?: string): Promise<FoodItem[]> {
    if (isConnectedToPostgres && pool) {
      try {
        const query = restaurantId
          ? 'SELECT * FROM food_items WHERE restaurant_id = $1 ORDER BY is_popular DESC, name ASC'
          : 'SELECT * FROM food_items ORDER BY name ASC';
        const params = restaurantId ? [restaurantId] : [];
        const res = await pool.query(query, params);
        if (res.rows.length > 0) return res.rows;

        // Fallback check on menu_items table if food_items was empty
        const mQuery = restaurantId
          ? 'SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY is_popular DESC, name ASC'
          : 'SELECT * FROM menu_items ORDER BY name ASC';
        const mRes = await pool.query(mQuery, params);
        return mRes.rows;
      } catch (err) {
        console.error('PG getFoodItems error:', err);
      }
    }
    if (restaurantId) {
      return memoryFoodItems.filter(f => f.restaurant_id === restaurantId);
    }
    return memoryFoodItems;
  },

  async createFoodItem(item: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    const restaurant = await this.getRestaurantById(item.restaurant_id);
    const restName = item.restaurant_name || restaurant?.name || 'Partner Kitchen';
    const vendorName = item.vendor_name || restName;

    const newItem: FoodItem = {
      ...item,
      id: `food-${Date.now()}`,
      restaurant_name: restName,
      vendor_name: vendorName
    };

    if (isConnectedToPostgres && pool) {
      try {
        // Insert into food_items
        await pool.query(
          `INSERT INTO food_items (id, restaurant_id, restaurant_name, vendor_name, name, description, price, category, image_url, is_available, is_popular)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [newItem.id, newItem.restaurant_id, newItem.restaurant_name, newItem.vendor_name, newItem.name, newItem.description, newItem.price, newItem.category, newItem.image_url, newItem.is_available, newItem.is_popular || false]
        );

        // Also insert into menu_items table
        try {
          await pool.query(
            `INSERT INTO menu_items (id, restaurant_id, restaurant_name, vendor_name, name, description, price, category, image_url, is_available, is_popular)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET name=$5, price=$7, image_url=$9, is_available=$10`,
            [newItem.id, newItem.restaurant_id, newItem.restaurant_name, newItem.vendor_name, newItem.name, newItem.description, newItem.price, newItem.category, newItem.image_url, newItem.is_available, newItem.is_popular || false]
          );
        } catch (mErr) {
          // ignore duplicate
        }

        return newItem;
      } catch (err) {
        console.error('PG createFoodItem error:', err);
      }
    }

    memoryFoodItems.push(newItem);
    return newItem;
  },

  async updateFoodItem(id: string, updates: Partial<FoodItem>): Promise<FoodItem | undefined> {
    if (isConnectedToPostgres && pool) {
      try {
        const res = await pool.query('SELECT * FROM food_items WHERE id = $1', [id]);
        let current = res.rows[0];
        if (!current) {
          const mRes = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
          current = mRes.rows[0];
        }
        if (!current) return undefined;

        const updated = { ...current, ...updates };
        await pool.query(
          `UPDATE food_items SET name=$1, description=$2, price=$3, category=$4, image_url=$5, is_available=$6, is_popular=$7, restaurant_name=$8, vendor_name=$9 WHERE id=$10`,
          [updated.name, updated.description, updated.price, updated.category, updated.image_url, updated.is_available, updated.is_popular, updated.restaurant_name || null, updated.vendor_name || null, id]
        );

        try {
          await pool.query(
            `UPDATE menu_items SET name=$1, description=$2, price=$3, category=$4, image_url=$5, is_available=$6, is_popular=$7, restaurant_name=$8, vendor_name=$9 WHERE id=$10`,
            [updated.name, updated.description, updated.price, updated.category, updated.image_url, updated.is_available, updated.is_popular, updated.restaurant_name || null, updated.vendor_name || null, id]
          );
        } catch (mErr) {}

        return updated;
      } catch (err) {
        console.error('PG updateFoodItem error:', err);
      }
    }

    const idx = memoryFoodItems.findIndex(f => f.id === id);
    if (idx !== -1) {
      memoryFoodItems[idx] = { ...memoryFoodItems[idx], ...updates };
      return memoryFoodItems[idx];
    }
    return undefined;
  },

  async deleteFoodItem(id: string): Promise<boolean> {
    if (isConnectedToPostgres && pool) {
      try {
        await pool.query('DELETE FROM food_items WHERE id = $1', [id]);
        try {
          await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
        } catch (e) {}
        return true;
      } catch (err) {
        console.error('PG deleteFoodItem error:', err);
      }
    }
    const lenBefore = memoryFoodItems.length;
    memoryFoodItems = memoryFoodItems.filter(f => f.id !== id);
    return memoryFoodItems.length < lenBefore;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (isConnectedToPostgres && pool) {
      try {
        const res = await pool.query('SELECT * FROM categories');
        return res.rows;
      } catch (err) {
        console.error('PG getCategories error:', err);
      }
    }
    return memoryCategories;
  },

  // Orders
  async getOrders(filter?: { restaurant_id?: string; rider_id?: string; status?: string }): Promise<Order[]> {
    if (isConnectedToPostgres && pool) {
      try {
        let query = 'SELECT * FROM orders WHERE 1=1';
        const params: any[] = [];
        if (filter?.restaurant_id) {
          params.push(filter.restaurant_id);
          query += ` AND restaurant_id = $${params.length}`;
        }
        if (filter?.rider_id) {
          params.push(filter.rider_id);
          query += ` AND rider_id = $${params.length}`;
        }
        if (filter?.status) {
          params.push(filter.status);
          query += ` AND status = $${params.length}`;
        }
        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, params);
        return res.rows;
      } catch (err) {
        console.error('PG getOrders error:', err);
      }
    }

    return memoryOrders.filter(o => {
      if (filter?.restaurant_id && o.restaurant_id !== filter.restaurant_id) return false;
      if (filter?.rider_id && o.rider_id !== filter.rider_id) return false;
      if (filter?.status && o.status !== filter.status) return false;
      return true;
    });
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    if (isConnectedToPostgres && pool) {
      try {
        const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        return res.rows[0];
      } catch (err) {
        console.error('PG getOrderById error:', err);
      }
    }
    return memoryOrders.find(o => o.id === id);
  },

  async createOrder(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const newOrder: Order = {
      ...data,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isConnectedToPostgres && pool) {
      try {
        await pool.query(
          `INSERT INTO orders (id, customer_name, customer_phone, delivery_address, restaurant_id, restaurant_name, items, subtotal, delivery_fee, total, status, payment_method, payment_status, rider_id, rider_name, rider_phone, notes, estimated_delivery_time, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [newOrder.id, newOrder.customer_name, newOrder.customer_phone, newOrder.delivery_address, newOrder.restaurant_id, newOrder.restaurant_name, JSON.stringify(newOrder.items), newOrder.subtotal, newOrder.delivery_fee, newOrder.total, newOrder.status, newOrder.payment_method, newOrder.payment_status, newOrder.rider_id || null, newOrder.rider_name || null, newOrder.rider_phone || null, newOrder.notes || '', newOrder.estimated_delivery_time || '30-40 min', newOrder.created_at, newOrder.updated_at]
        );
        return newOrder;
      } catch (err) {
        console.error('PG createOrder error:', err);
      }
    }

    memoryOrders.unshift(newOrder);
    return newOrder;
  },

  async updateOrderStatus(id: string, status: Order['status'], riderDetails?: { rider_id?: string; rider_name?: string; rider_phone?: string }): Promise<Order | undefined> {
    const updatedAt = new Date().toISOString();
    if (isConnectedToPostgres && pool) {
      try {
        const current = await this.getOrderById(id);
        if (!current) return undefined;
        const updated = {
          ...current,
          status,
          ...(riderDetails?.rider_id ? { rider_id: riderDetails.rider_id, rider_name: riderDetails.rider_name, rider_phone: riderDetails.rider_phone } : {}),
          updated_at: updatedAt
        };
        await pool.query(
          `UPDATE orders SET status=$1, rider_id=$2, rider_name=$3, rider_phone=$4, updated_at=$5 WHERE id=$6`,
          [updated.status, updated.rider_id || null, updated.rider_name || null, updated.rider_phone || null, updatedAt, id]
        );
        return updated;
      } catch (err) {
        console.error('PG updateOrderStatus error:', err);
      }
    }

    const idx = memoryOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      memoryOrders[idx] = {
        ...memoryOrders[idx],
        status,
        ...(riderDetails?.rider_id ? { rider_id: riderDetails.rider_id, rider_name: riderDetails.rider_name, rider_phone: riderDetails.rider_phone } : {}),
        updated_at: updatedAt
      };
      return memoryOrders[idx];
    }
    return undefined;
  },

  // Riders
  async getRiders(): Promise<Rider[]> {
    if (isConnectedToPostgres && pool) {
      try {
        const res = await pool.query('SELECT * FROM riders ORDER BY is_online DESC, name ASC');
        return res.rows;
      } catch (err) {
        console.error('PG getRiders error:', err);
      }
    }
    return memoryRiders;
  },

  async updateRiderStatus(id: string, isOnline: boolean, location?: string): Promise<Rider | undefined> {
    if (isConnectedToPostgres && pool) {
      try {
        await pool.query(
          `UPDATE riders SET is_online=$1, current_location=COALESCE($2, current_location), status=CASE WHEN $1 THEN 'available' ELSE 'offline' END WHERE id=$3`,
          [isOnline, location || null, id]
        );
        const res = await pool.query('SELECT * FROM riders WHERE id = $1', [id]);
        return res.rows[0];
      } catch (err) {
        console.error('PG updateRiderStatus error:', err);
      }
    }

    const rider = memoryRiders.find(r => r.id === id);
    if (rider) {
      rider.is_online = isOnline;
      rider.status = isOnline ? 'available' : 'offline';
      if (location) rider.current_location = location;
      return rider;
    }
    return undefined;
  },

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    if (isConnectedToPostgres && pool) {
      try {
        const res = await pool.query('SELECT * FROM vendors');
        return res.rows;
      } catch (err) {
        console.error('PG getVendors error:', err);
      }
    }
    return memoryVendors;
  },

  // Logs
  async addLog(source: string, event: string, details: any) {
    if (isConnectedToPostgres && pool) {
      try {
        await pool.query(
          'INSERT INTO system_logs (source, event, details) VALUES ($1, $2, $3)',
          [source, event, JSON.stringify(details)]
        );
      } catch (err) {
        // Silently pass
      }
    }
  }
};
