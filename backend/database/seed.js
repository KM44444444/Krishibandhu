const bcrypt = require('bcryptjs');
const db = require('../config/database');

console.log('🌱 Seeding KrishiBandhu database...');

const hash = (pw) => bcrypt.hashSync(pw, 10);
const DEMO_PASSWORD = 'password123';

// ---------- Clear existing data (idempotent re-seed) ----------
const tables = ['notifications', 'consultation_messages', 'consultations', 'order_items', 'orders',
    'products', 'soil_reports', 'soil_requests', 'farmer_activities', 'crop_calendar', 'crops',
    'farms', 'alerts', 'videos', 'users'];
tables.forEach(t => db.prepare(`DELETE FROM ${t}`).run());

// ---------- USERS (one demo account per role) ----------
const insertUser = db.prepare(`INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, 'active')`);

const users = {
    farmer: insertUser.run('Rahul Kumar', 'farmer@krishibandhu.com', hash(DEMO_PASSWORD), '9876500001', 'farmer').lastInsertRowid,
    farmer2: insertUser.run('Sita Devi', 'sita@krishibandhu.com', hash(DEMO_PASSWORD), '9876500011', 'farmer').lastInsertRowid,
    government: insertUser.run('Anil Verma', 'government@krishibandhu.com', hash(DEMO_PASSWORD), '9876500002', 'government').lastInsertRowid,
    admin: insertUser.run('Priya Singh', 'admin@krishibandhu.com', hash(DEMO_PASSWORD), '9876500003', 'admin').lastInsertRowid,
    buyer: insertUser.run('Vikram Traders', 'buyer@krishibandhu.com', hash(DEMO_PASSWORD), '9876500004', 'buyer').lastInsertRowid,
    seller: insertUser.run('Green Agro Store', 'seller@krishibandhu.com', hash(DEMO_PASSWORD), '9876500005', 'seller').lastInsertRowid,
    expert: insertUser.run('Dr. Sharma', 'expert@krishibandhu.com', hash(DEMO_PASSWORD), '9876500006', 'expert').lastInsertRowid,
};

// ---------- CROPS + CALENDAR TEMPLATES ----------
const insertCrop = db.prepare(`INSERT INTO crops (name, season, soil_type, ph_min, ph_max, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const insertCalendar = db.prepare(`INSERT INTO crop_calendar (crop_id, activity, start_day, end_day, description) VALUES (?, ?, ?, ?, ?)`);

const cropDefs = [
    { name: 'Wheat', season: 'rabi', soil_type: 'loamy', ph_min: 6.0, ph_max: 7.5, description: 'A staple rabi cereal crop suited to loamy soils with moderate irrigation.' },
    { name: 'Rice', season: 'kharif', soil_type: 'clay', ph_min: 5.5, ph_max: 7.0, description: 'A kharif crop requiring standing water and clayey, water-retentive soil.' },
    { name: 'Maize', season: 'kharif', soil_type: 'loamy', ph_min: 5.8, ph_max: 7.0, description: 'A versatile cereal grown in both kharif and rabi seasons on well-drained loamy soil.' },
    { name: 'Mustard', season: 'rabi', soil_type: 'sandy', ph_min: 6.0, ph_max: 7.5, description: 'An oilseed rabi crop tolerant of sandy loam and moderate soil fertility.' },
    { name: 'Potato', season: 'rabi', soil_type: 'sandy', ph_min: 5.0, ph_max: 6.5, description: 'A rabi tuber crop preferring well-drained sandy loam and slightly acidic soil.' },
];

const cropIds = {};
cropDefs.forEach(c => {
    const id = insertCrop.run(c.name, c.season, c.soil_type, c.ph_min, c.ph_max, c.description, null).lastInsertRowid;
    cropIds[c.name] = id;

    const activities = [
        { activity: 'Land Preparation', start_day: 0, end_day: 5, description: 'Plough and prepare the field.' },
        { activity: 'Sowing', start_day: 6, end_day: 10, description: 'Sow seeds at recommended spacing.' },
        { activity: 'Irrigation', start_day: 20, end_day: 20, description: 'First irrigation cycle.' },
        { activity: 'Fertilizer Application', start_day: 25, end_day: 25, description: 'Apply base fertilizer dose.' },
        { activity: 'Pest/Disease Management', start_day: 45, end_day: 45, description: 'Inspect and treat for common pests.' },
        { activity: 'Harvesting', start_day: 100, end_day: 110, description: 'Harvest when crop reaches maturity.' },
    ];
    activities.forEach(a => insertCalendar.run(id, a.activity, a.start_day, a.end_day, a.description));
});

// ---------- FARM ----------
const farmId = db.prepare(`
    INSERT INTO farms (farmer_id, farm_name, land_area, land_unit, location, current_crop, irrigation_type, land_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(users.farmer, 'Green Valley Farm', 5.2, 'acre', 'Village Rampur, Block Sehore, Madhya Pradesh', 'Wheat', 'Drip Irrigation', 'Loamy Soil').lastInsertRowid;

db.prepare(`
    INSERT INTO farms (farmer_id, farm_name, land_area, land_unit, location, current_crop, irrigation_type, land_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(users.farmer, 'Riverside Plot', 2.8, 'acre', 'Near Narmada River, Sehore', 'Maize', 'Canal Irrigation', 'Clay Soil');

// ---------- SOIL REQUEST + VERIFIED REPORT ----------
const requestId = db.prepare(`
    INSERT INTO soil_requests (farmer_id, farm_id, request_type, status) VALUES (?, ?, 'standard', 'completed')
`).run(users.farmer, farmId).lastInsertRowid;

db.prepare(`
    INSERT INTO soil_reports (request_id, government_user_id, ph, nitrogen, phosphorus, potassium, organic_carbon, moisture, remarks, verified_at)
    VALUES (?, ?, 6.8, 230, 45, 210, 0.75, 18, 'Soil health is good overall. Suitable for wheat and maize rotation.', datetime('now','-13 days'))
`).run(requestId, users.government);

// A second, pending soil request for demoing the government workflow
db.prepare(`
    INSERT INTO soil_requests (farmer_id, farm_id, request_type, status) VALUES (?, ?, 'standard', 'pending')
`).run(users.farmer2, null);

// ---------- FARMER ACTIVITIES (crop calendar instances) ----------
const insertActivity = db.prepare(`
    INSERT INTO farmer_activities (farmer_id, farm_id, crop_id, activity, activity_date, status)
    VALUES (?, ?, ?, ?, date('now', ?), 'upcoming')
`);
insertActivity.run(users.farmer, farmId, cropIds['Wheat'], 'Wheat Irrigation', '+3 days');
insertActivity.run(users.farmer, farmId, cropIds['Wheat'], 'Fertilizer Application', '+5 days');
insertActivity.run(users.farmer, farmId, cropIds['Wheat'], 'Pest Control', '+10 days');
insertActivity.run(users.farmer, farmId, cropIds['Wheat'], 'Harvesting', '+26 days');
insertActivity.run(users.farmer, farmId, cropIds['Maize'], 'Land Preparation', '+30 days');

// ---------- PRODUCTS ----------
const insertProduct = db.prepare(`
    INSERT INTO products (seller_id, name, description, category, price, stock, status) VALUES (?, ?, ?, ?, ?, ?, 'active')
`);
insertProduct.run(users.seller, 'NPK 19:19:19 Fertilizer (50kg)', 'Balanced fertilizer blend suitable for most crops at vegetative stage.', 'Fertilizer', 1250, 80);
insertProduct.run(users.seller, 'Urea (45kg bag)', 'High-nitrogen fertilizer for vegetative growth boost.', 'Fertilizer', 320, 150);
insertProduct.run(users.seller, 'Hybrid Maize Seeds (5kg)', 'High-yield hybrid maize seed variety suited for kharif season.', 'Seeds', 1800, 40);
insertProduct.run(users.seller, 'Certified Wheat Seeds (40kg)', 'High-germination certified wheat seed, rabi season.', 'Seeds', 2100, 60);
insertProduct.run(users.seller, 'Drip Irrigation Kit (1 acre)', 'Complete drip irrigation setup for water-efficient farming.', 'Equipment', 8500, 15);
insertProduct.run(users.seller, 'Neem-based Pesticide (1L)', 'Organic pest control solution safe for most crops.', 'Pesticide', 450, 100);

// ---------- ORDER (demo) ----------
const products = db.prepare('SELECT * FROM products LIMIT 2').all();
const orderTotal = products.reduce((sum, p) => sum + p.price * 2, 0);
const orderId = db.prepare(`INSERT INTO orders (buyer_id, total_amount, status) VALUES (?, ?, 'accepted')`).run(users.farmer, orderTotal).lastInsertRowid;
products.forEach(p => {
    db.prepare(`INSERT INTO order_items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, 2, ?)`).run(orderId, p.id, p.seller_id, p.price);
});

// ---------- CONSULTATIONS ----------
const consultId = db.prepare(`
    INSERT INTO consultations (farmer_id, expert_id, type, subject, status) VALUES (?, ?, 'chat', 'Yellowing leaves on wheat crop', 'in_progress')
`).run(users.farmer, users.expert).lastInsertRowid;
db.prepare(`INSERT INTO consultation_messages (consultation_id, sender_id, message) VALUES (?, ?, ?)`)
    .run(consultId, users.farmer, 'My wheat leaves are turning yellow near the tips. What could be the cause?');
db.prepare(`INSERT INTO consultation_messages (consultation_id, sender_id, message) VALUES (?, ?, ?)`)
    .run(consultId, users.expert, 'This is often a sign of nitrogen deficiency. Can you share your latest soil report N value?');

db.prepare(`
    INSERT INTO consultations (farmer_id, type, subject, status) VALUES (?, 'consultation', 'Best irrigation schedule for maize', 'open')
`).run(users.farmer2);

// ---------- VIDEOS ----------
const insertVideo = db.prepare(`INSERT INTO videos (title, category, youtube_url, description, status) VALUES (?, ?, ?, ?, 'active')`);
insertVideo.run('Wheat Farming Complete Guide', 'Farming Guides', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Step-by-step guide to wheat cultivation from sowing to harvest.');
insertVideo.run('Understanding Your Soil Report', 'Soil Guides', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'How to read pH, N, P, K values and what they mean for your crop.');
insertVideo.run('Identifying Common Crop Diseases', 'Disease Guides', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Visual guide to spotting early signs of common plant diseases.');
insertVideo.run('Drip Irrigation Setup Tutorial', 'Other Agricultural Guides', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'How to install and maintain a drip irrigation system.');

// ---------- GOVERNMENT ALERT ----------
const alertId = db.prepare(`INSERT INTO alerts (posted_by, title, message) VALUES (?, ?, ?)`)
    .run(users.government, 'New Government Scheme for Farmers', 'PM-KISAN installment for this quarter has been released. Check your bank account.').lastInsertRowid;

// ---------- NOTIFICATIONS (farmer) ----------
const insertNotif = db.prepare(`INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`);
insertNotif.run(users.farmer, 'Soil Report Ready', 'Your soil report is ready. Please check.', 'soil_report', requestId, 0, '-13 days');
insertNotif.run(users.farmer, 'Order Confirmed', `Your order #ORD${orderId} has been confirmed.`, 'order', orderId, 0, '-14 days');
insertNotif.run(users.farmer, 'Expert Replied', 'Dr. Sharma replied to your question.', 'consultation', consultId, 0, '-14 days');
insertNotif.run(users.farmer, 'Government Alert', 'New government scheme for farmers.', 'government_alert', alertId, 0, '-15 days');

console.log('✅ Seed complete!\n');
console.log('Demo accounts (all use password: ' + DEMO_PASSWORD + ')');
console.log('  Farmer:     farmer@krishibandhu.com');
console.log('  Government: government@krishibandhu.com');
console.log('  Admin:      admin@krishibandhu.com');
console.log('  Buyer:      buyer@krishibandhu.com');
console.log('  Seller:     seller@krishibandhu.com');
console.log('  Expert:     expert@krishibandhu.com\n');
