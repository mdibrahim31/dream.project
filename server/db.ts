import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const connectionString = process.env.DATABASE_URL;
export const pool = connectionString ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } }) : null;

export async function query(text: string, params?: any[]) {
  if (pool) {
    const client = await pool.connect();
    try {
      const res = await client.query(text, params);
      return res;
    } finally {
      client.release();
    }
  }
  throw new Error('Database pool not initialized. Check DATABASE_URL.');
}

export async function initDatabase() {
  if (!pool) {
    console.warn('⚠️ DATABASE_URL not set. Running in memory/mock persistence mode.');
    return;
  }

  try {
    // Create tables if not exist
    await query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        cuisine VARCHAR(100),
        rating NUMERIC(3,2) DEFAULT 4.8,
        delivery_time VARCHAR(50) DEFAULT '25-35 min',
        min_order NUMERIC(10,2) DEFAULT 200,
        delivery_fee NUMERIC(10,2) DEFAULT 50,
        image_url TEXT,
        banner_url TEXT,
        is_open BOOLEAN DEFAULT TRUE,
        address TEXT,
        phone VARCHAR(50),
        vendor_id VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(50) PRIMARY KEY,
        restaurant_id VARCHAR(50) REFERENCES restaurants(id) ON DELETE CASCADE,
        restaurant_name VARCHAR(255),
        vendor_name VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        category VARCHAR(100),
        image_url TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        is_popular BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        delivery_address TEXT NOT NULL,
        restaurant_id VARCHAR(50) REFERENCES restaurants(id),
        restaurant_name VARCHAR(255),
        items JSONB NOT NULL,
        subtotal NUMERIC(10,2) NOT NULL,
        delivery_fee NUMERIC(10,2) NOT NULL,
        total NUMERIC(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'placed',
        payment_method VARCHAR(50) DEFAULT 'cod',
        payment_status VARCHAR(50) DEFAULT 'pending',
        prep_minutes INTEGER DEFAULT 20,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS riders (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        is_online BOOLEAN DEFAULT TRUE,
        total_deliveries INTEGER DEFAULT 142,
        total_earnings NUMERIC(10,2) DEFAULT 11360,
        current_location VARCHAR(255) DEFAULT 'Gulshan Circle 2, Dhaka'
      );
    `);

    // Seed initial restaurants if empty
    const restRes = await query('SELECT COUNT(*) FROM restaurants');
    if (parseInt(restRes.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO restaurants (id, name, slug, cuisine, rating, delivery_time, min_order, delivery_fee, image_url, banner_url, is_open, address, phone, vendor_id)
        VALUES 
        ('rest-1', 'Sultans Dine', 'sultans-dine', 'Biryani & Mughlai', 4.8, '25-35 min', 200, 50, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80', true, 'Gulshan 2, Dhaka', '+8801711122334', 'vendor-1'),
        ('rest-2', 'Kacchi Bhai', 'kacchi-bhai', 'Traditional Kacchi', 4.9, '20-30 min', 250, 60, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1200&q=80', true, 'Dhanmondi 27, Dhaka', '+8801822334455', 'vendor-2');
      `);
      console.log('✅ Seeded default restaurants.');
    }

    // Seed categories if empty
    const catRes = await query('SELECT COUNT(*) FROM categories');
    if (parseInt(catRes.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO categories (id, name, icon)
        VALUES 
        ('cat-1', 'All', '🍽️'),
        ('cat-2', 'Biryani', '🍲'),
        ('cat-3', 'Main Course', '🍗'),
        ('cat-4', 'Beverages', '🥤'),
        ('cat-5', 'Desserts', '🍮');
      `);
      console.log('✅ Seeded default categories.');
    }

    // Seed menu items if empty
    const menuRes = await query('SELECT COUNT(*) FROM menu_items');
    if (parseInt(menuRes.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO menu_items (id, restaurant_id, restaurant_name, vendor_name, name, description, price, category, image_url, is_available, is_popular)
        VALUES 
        ('food-1', 'rest-1', 'Sultans Dine', 'Sultans Dine Kitchen', 'Kacchi Mutton Tehari', 'Tender mutton chunks layered with aromatic chinigura rice and secret spices.', 380, 'Biryani', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80', true, true),
        ('food-2', 'rest-1', 'Sultans Dine', 'Sultans Dine Kitchen', 'Chicken Roast & Polao', 'Classic rich chicken roast served with fragrant ghee polao and boiled egg.', 290, 'Main Course', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80', true, true),
        ('food-3', 'rest-2', 'Kacchi Bhai', 'Kacchi Bhai Kitchen', 'Special Kacchi Dum Biryani', 'Slow-cooked prime mutton with potatoes, saffron, and premium basmati rice.', 420, 'Biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', true, true);
      `);
      console.log('✅ Seeded default menu items.');
    }

    // Seed rider if empty
    const riderRes = await query('SELECT COUNT(*) FROM riders');
    if (parseInt(riderRes.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO riders (id, name, phone, is_online, total_deliveries, total_earnings, current_location)
        VALUES ('rider-1', 'Tanvir Ahmed', '+8801911223344', true, 142, 11360, 'Gulshan Circle 2, Dhaka');
      `);
      console.log('✅ Seeded default rider.');
    }

    console.log('🚀 Database initialization completed successfully.');
  } catch (err) {
    console.error('Database migration error:', err);
  }

  // Ensure Supabase Storage bucket 'food-delivery-assets' exists
  if (supabase) {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === 'food-delivery-assets');
      if (!bucketExists) {
        await supabase.storage.createBucket('food-delivery-assets', { public: true });
        console.log('✅ Auto-created Supabase Storage bucket: "food-delivery-assets"');
      }
    } catch (sbErr: any) {
      console.warn('⚠️ Supabase Storage initialization note:', sbErr.message);
    }
  }
}
