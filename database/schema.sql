-- ============================================================
-- KRISHIBANDHU — DATABASE SCHEMA
-- ============================================================

PRAGMA foreign_keys = ON;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('farmer','government','admin','buyer','seller','expert')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- FARMS ----------
CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    farm_name TEXT NOT NULL,
    land_area REAL,
    land_unit TEXT DEFAULT 'acre',
    location TEXT,
    current_crop TEXT,
    irrigation_type TEXT,
    land_type TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- CROPS (reference database) ----------
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    season TEXT,                 -- kharif / rabi / zaid
    soil_type TEXT,               -- loamy / clay / sandy / black / alluvial
    ph_min REAL,
    ph_max REAL,
    description TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- CROP CALENDAR (activity templates per crop) ----------
CREATE TABLE IF NOT EXISTS crop_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    activity TEXT NOT NULL,
    start_day INTEGER,
    end_day INTEGER,
    description TEXT,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- ---------- FARMER CROP ACTIVITIES (actual scheduled instances) ----------
CREATE TABLE IF NOT EXISTS farmer_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    farm_id INTEGER,
    crop_id INTEGER,
    activity TEXT NOT NULL,
    activity_date DATE NOT NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','completed','overdue')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL
);

-- ---------- SOIL REQUESTS ----------
CREATE TABLE IF NOT EXISTS soil_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    farm_id INTEGER,
    request_type TEXT DEFAULT 'standard',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
);

-- ---------- SOIL REPORTS (official, government-verified) ----------
CREATE TABLE IF NOT EXISTS soil_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    government_user_id INTEGER,
    ph REAL,
    nitrogen REAL,
    phosphorus REAL,
    potassium REAL,
    organic_carbon REAL,
    moisture REAL,
    other_parameters TEXT,
    report_file TEXT,
    remarks TEXT,
    verified_at DATETIME,
    FOREIGN KEY (request_id) REFERENCES soil_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (government_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------- MARKETPLACE: PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','shipped','delivered','cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- CONSULTATIONS (chat / consultation / video) ----------
CREATE TABLE IF NOT EXISTS consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    expert_id INTEGER,
    type TEXT NOT NULL DEFAULT 'chat' CHECK (type IN ('chat','consultation','video')),
    subject TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','completed','cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS consultation_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    reference_id INTEGER,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- LEARNING VIDEOS ----------
CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    youtube_url TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- GOVERNMENT ALERTS ----------
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    posted_by INTEGER,
    title TEXT NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);
