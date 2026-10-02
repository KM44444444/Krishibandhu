const db = require('../config/database');
const { recommendCrops, recommendFertilizer } = require('../services/recommendation.service');
// Crop reference database (public to logged-in users)
exports.listCrops = (req, res, next) => {
    try {
        const crops = db.prepare('SELECT * FROM crops ORDER BY name ASC').all();
        res.json({ success: true, crops });
    } catch (err) { next(err); }
};

exports.getCrop = (req, res, next) => {
    try {
        const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(req.params.id);
        if (!crop) return res.status(404).json({ success: false, message: 'Crop not found.' });
        const calendar = db.prepare('SELECT * FROM crop_calendar WHERE crop_id = ? ORDER BY start_day ASC').all(crop.id);
        res.json({ success: true, crop, calendar });
    } catch (err) { next(err); }
};
// ADMIN: manage crop database
exports.createCrop = (req, res, next) => {
    try {
        const { name, season, soil_type, ph_min, ph_max, description, image_url } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Crop name is required.' });
        const result = db.prepare(`
            INSERT INTO crops (name, season, soil_type, ph_min, ph_max, description, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(name, season || null, soil_type || null, ph_min || null, ph_max || null, description || null, image_url || null);
        const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, message: 'Crop added.', crop });
    } catch (err) { next(err); }
};

exports.updateCrop = (req, res, next) => {
    try {
        const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(req.params.id);
        if (!crop) return res.status(404).json({ success: false, message: 'Crop not found.' });
        const fields = ['name', 'season', 'soil_type', 'ph_min', 'ph_max', 'description', 'image_url'];
        const updates = {};
        fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        if (setClause) db.prepare(`UPDATE crops SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);
        res.json({ success: true, message: 'Crop updated.' });
    } catch (err) { next(err); }
};

exports.deleteCrop = (req, res, next) => {
    try {
        db.prepare('DELETE FROM crops WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Crop removed.' });
    } catch (err) { next(err); }
};
// FARMER: crop calendar (their scheduled activities)
exports.myCalendar = (req, res, next) => {
    try {
        const activities = db.prepare(`
            SELECT fa.*, c.name as crop_name FROM farmer_activities fa
            LEFT JOIN crops c ON fa.crop_id = c.id
            WHERE fa.farmer_id = ?
            ORDER BY fa.activity_date ASC
        `).all(req.user.id);
        res.json({ success: true, activities });
    } catch (err) { next(err); }
};

exports.addActivity = (req, res, next) => {
    try {
        const { farm_id, crop_id, activity, activity_date } = req.body;
        if (!activity || !activity_date) return res.status(400).json({ success: false, message: 'Activity and date are required.' });
        const result = db.prepare(`
            INSERT INTO farmer_activities (farmer_id, farm_id, crop_id, activity, activity_date, status)
            VALUES (?, ?, ?, ?, ?, 'upcoming')
        `).run(req.user.id, farm_id || null, crop_id || null, activity, activity_date);
        res.status(201).json({ success: true, message: 'Activity added to calendar.', id: result.lastInsertRowid });
    } catch (err) { next(err); }
};

exports.updateActivityStatus = (req, res, next) => {
    try {
        const { status } = req.body;
        db.prepare('UPDATE farmer_activities SET status = ? WHERE id = ? AND farmer_id = ?').run(status, req.params.id, req.user.id);
        res.json({ success: true, message: 'Activity updated.' });
    } catch (err) { next(err); }
};

// Generate a calendar from a crop's template into the farmer's own activities
exports.applyCropTemplate = (req, res, next) => {
    try {
        const { crop_id, farm_id, start_date } = req.body;
        const calendarItems = db.prepare('SELECT * FROM crop_calendar WHERE crop_id = ?').all(crop_id);
        if (calendarItems.length === 0) {
            return res.status(404).json({ success: false, message: 'No calendar template found for this crop.' });
        }
        const base = new Date(start_date);
        const insert = db.prepare(`
            INSERT INTO farmer_activities (farmer_id, farm_id, crop_id, activity, activity_date, status)
            VALUES (?, ?, ?, ?, ?, 'upcoming')
        `);
        calendarItems.forEach(item => {
            const d = new Date(base);
            d.setDate(d.getDate() + (item.start_day || 0));
            insert.run(req.user.id, farm_id || null, crop_id, item.activity, d.toISOString().slice(0, 10));
        });
        res.status(201).json({ success: true, message: `${calendarItems.length} activities scheduled from crop calendar template.` });
    } catch (err) { next(err); }
};
// FARMER: crop recommendation using latest soil report
exports.getCropRecommendation = (req, res, next) => {
    try {
        const report = db.prepare(`
            SELECT sr.* FROM soil_reports sr
            JOIN soil_requests req ON sr.request_id = req.id
            WHERE req.farmer_id = ? AND sr.verified_at IS NOT NULL
            ORDER BY sr.verified_at DESC LIMIT 1
        `).get(req.user.id);

        if (!report) {
            return res.json({ success: true, hasReport: false, message: 'No verified soil report yet. Submit a soil request first for personalized recommendations.', recommendations: [] });
        }

        const { season } = req.query;
        const recommendations = recommendCrops(report, season);
        res.json({ success: true, hasReport: true, report, recommendations });
    } catch (err) { next(err); }
};
// FARMER: fertilizer recommendation using latest soil report
exports.getFertilizerRecommendation = (req, res, next) => {
    try {
        const report = db.prepare(`
            SELECT sr.* FROM soil_reports sr
            JOIN soil_requests req ON sr.request_id = req.id
            WHERE req.farmer_id = ? AND sr.verified_at IS NOT NULL
            ORDER BY sr.verified_at DESC LIMIT 1
        `).get(req.user.id);

        if (!report) {
            return res.json({ success: true, hasReport: false, message: 'No verified soil report yet. Submit a soil request first for personalized guidance.', guidance: null });
        }

        const guidance = recommendFertilizer(report);
        res.json({ success: true, hasReport: true, report, guidance });
    } catch (err) { next(err); }
};
