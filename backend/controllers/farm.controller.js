const db = require('../config/database');

exports.listMyFarms = (req, res, next) => {
    try {
        const farms = db.prepare('SELECT * FROM farms WHERE farmer_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json({ success: true, farms });
    } catch (err) { next(err); }
};

exports.getFarm = (req, res, next) => {
    try {
        const farm = db.prepare('SELECT * FROM farms WHERE id = ? AND farmer_id = ?').get(req.params.id, req.user.id);
        if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });
        res.json({ success: true, farm });
    } catch (err) { next(err); }
};

exports.createFarm = (req, res, next) => {
    try {
        const { farm_name, land_area, land_unit, location, current_crop, irrigation_type, land_type, image_url } = req.body;
        if (!farm_name) return res.status(400).json({ success: false, message: 'Farm name is required.' });

        const result = db.prepare(`
            INSERT INTO farms (farmer_id, farm_name, land_area, land_unit, location, current_crop, irrigation_type, land_type, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.id, farm_name, land_area || null, land_unit || 'acre', location || null, current_crop || null, irrigation_type || null, land_type || null, image_url || null);

        const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, message: 'Farm created.', farm });
    } catch (err) { next(err); }
};

exports.updateFarm = (req, res, next) => {
    try {
        const farm = db.prepare('SELECT * FROM farms WHERE id = ? AND farmer_id = ?').get(req.params.id, req.user.id);
        if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });

        const fields = ['farm_name', 'land_area', 'land_unit', 'location', 'current_crop', 'irrigation_type', 'land_type', 'image_url'];
        const updates = {};
        fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        if (setClause) {
            db.prepare(`UPDATE farms SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);
        }
        const updated = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id);
        res.json({ success: true, message: 'Farm updated.', farm: updated });
    } catch (err) { next(err); }
};

exports.deleteFarm = (req, res, next) => {
    try {
        const farm = db.prepare('SELECT * FROM farms WHERE id = ? AND farmer_id = ?').get(req.params.id, req.user.id);
        if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });
        db.prepare('DELETE FROM farms WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Farm deleted.' });
    } catch (err) { next(err); }
};

// Farmer dashboard summary
exports.dashboardSummary = (req, res, next) => {
    try {
        const farmerId = req.user.id;
        const farms = db.prepare('SELECT COUNT(*) c FROM farms WHERE farmer_id = ?').get(farmerId).c;
        const soilReports = db.prepare(`
            SELECT COUNT(*) c FROM soil_reports sr
            JOIN soil_requests req ON sr.request_id = req.id
            WHERE req.farmer_id = ?
        `).get(farmerId).c;
        const upcomingActivities = db.prepare(`
            SELECT COUNT(*) c FROM farmer_activities WHERE farmer_id = ? AND status = 'upcoming'
        `).get(farmerId).c;
        const consultations = db.prepare(`
            SELECT COUNT(*) c FROM consultations WHERE farmer_id = ? AND status IN ('open','assigned','in_progress')
        `).get(farmerId).c;
        const orders = db.prepare(`
            SELECT COUNT(*) c FROM orders WHERE buyer_id = ? AND created_at >= date('now','-30 day')
        `).get(farmerId).c;

        const farm = db.prepare('SELECT * FROM farms WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 1').get(farmerId);

        const recentReport = db.prepare(`
            SELECT sr.*, req.status as request_status FROM soil_reports sr
            JOIN soil_requests req ON sr.request_id = req.id
            WHERE req.farmer_id = ?
            ORDER BY sr.verified_at DESC LIMIT 1
        `).get(farmerId);

        const activities = db.prepare(`
            SELECT * FROM farmer_activities WHERE farmer_id = ? AND status = 'upcoming'
            ORDER BY activity_date ASC LIMIT 5
        `).all(farmerId);

        const notifications = db.prepare(`
            SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
        `).all(farmerId);

        res.json({
            success: true,
            stats: { farms, soilReports, upcomingActivities, consultations, orders },
            farm,
            recentReport,
            activities,
            notifications
        });
    } catch (err) { next(err); }
};
