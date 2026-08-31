const db = require('../config/database');

exports.listUsers = (req, res, next) => {
    try {
        const { role } = req.query;
        let query = 'SELECT id, name, email, phone, role, status, created_at FROM users';
        const params = [];
        if (role) { query += ' WHERE role = ?'; params.push(role); }
        query += ' ORDER BY created_at DESC';
        const users = db.prepare(query).all(...params);
        res.json({ success: true, users });
    } catch (err) { next(err); }
};

exports.updateUserStatus = (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
        db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
        res.json({ success: true, message: `User ${status === 'active' ? 'activated' : 'deactivated'}.` });
    } catch (err) { next(err); }
};

exports.deleteUser = (req, res, next) => {
    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'User removed.' });
    } catch (err) { next(err); }
};

exports.systemStats = (req, res, next) => {
    try {
        const counts = {};
        ['farmer', 'government', 'admin', 'buyer', 'seller', 'expert'].forEach(role => {
            counts[role] = db.prepare('SELECT COUNT(*) c FROM users WHERE role = ?').get(role).c;
        });
        const totalUsers = db.prepare('SELECT COUNT(*) c FROM users').get().c;
        const totalFarms = db.prepare('SELECT COUNT(*) c FROM farms').get().c;
        const totalOrders = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
        const totalProducts = db.prepare('SELECT COUNT(*) c FROM products').get().c;
        const pendingSoilRequests = db.prepare(`SELECT COUNT(*) c FROM soil_requests WHERE status = 'pending'`).get().c;
        const activeConsultations = db.prepare(`SELECT COUNT(*) c FROM consultations WHERE status IN ('open','assigned','in_progress')`).get().c;
        const revenue = db.prepare(`SELECT COALESCE(SUM(total_amount),0) t FROM orders WHERE status != 'cancelled'`).get().t;

        res.json({
            success: true,
            stats: { totalUsers, totalFarms, totalOrders, totalProducts, pendingSoilRequests, activeConsultations, revenue, byRole: counts }
        });
    } catch (err) { next(err); }
};

// ---- ADMIN: monitor all consultations platform-wide ----
exports.listConsultations = (req, res, next) => {
    try {
        const { status, type } = req.query;
        let query = `
            SELECT c.*, f.name as farmer_name, e.name as expert_name
            FROM consultations c
            JOIN users f ON c.farmer_id = f.id
            LEFT JOIN users e ON c.expert_id = e.id
        `;
        const conditions = [];
        const params = [];
        if (status) { conditions.push('c.status = ?'); params.push(status); }
        if (type) { conditions.push('c.type = ?'); params.push(type); }
        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY c.created_at DESC';
        const consultations = db.prepare(query).all(...params);
        res.json({ success: true, consultations });
    } catch (err) { next(err); }
};

// ---- GOVERNMENT / ADMIN alerts ----
exports.listAlerts = (req, res, next) => {
    try {
        const alerts = db.prepare(`
            SELECT a.*, u.name as posted_by_name FROM alerts a
            LEFT JOIN users u ON a.posted_by = u.id
            ORDER BY a.created_at DESC
        `).all();
        res.json({ success: true, alerts });
    } catch (err) { next(err); }
};

exports.createAlert = (req, res, next) => {
    try {
        const { title, message } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Alert title is required.' });
        const result = db.prepare('INSERT INTO alerts (posted_by, title, message) VALUES (?, ?, ?)').run(req.user.id, title, message || null);

        // Notify all farmers
        const farmers = db.prepare(`SELECT id FROM users WHERE role = 'farmer' AND status = 'active'`).all();
        const insertNotif = db.prepare(`INSERT INTO notifications (user_id, title, message, type, reference_id) VALUES (?, ?, ?, 'government_alert', ?)`);
        farmers.forEach(f => insertNotif.run(f.id, title, message || '', result.lastInsertRowid));

        res.status(201).json({ success: true, message: 'Alert published to all farmers.' });
    } catch (err) { next(err); }
};
