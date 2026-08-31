const db = require('../config/database');
const { createNotification } = require('../services/notification.service');

// ---- FARMER: create a soil request ----
exports.createRequest = (req, res, next) => {
    try {
        const { farm_id, request_type } = req.body;
        const result = db.prepare(`
            INSERT INTO soil_requests (farmer_id, farm_id, request_type, status)
            VALUES (?, ?, ?, 'pending')
        `).run(req.user.id, farm_id || null, request_type || 'standard');

        const request = db.prepare('SELECT * FROM soil_requests WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, message: 'Soil testing request submitted. The government office will process it.', request });
    } catch (err) { next(err); }
};

// ---- FARMER: list my requests + reports ----
exports.myRequests = (req, res, next) => {
    try {
        const requests = db.prepare(`
            SELECT req.*, f.farm_name,
                   sr.id as report_id, sr.ph, sr.nitrogen, sr.phosphorus, sr.potassium, sr.organic_carbon, sr.verified_at
            FROM soil_requests req
            LEFT JOIN farms f ON req.farm_id = f.id
            LEFT JOIN soil_reports sr ON sr.request_id = req.id
            WHERE req.farmer_id = ?
            ORDER BY req.requested_at DESC
        `).all(req.user.id);
        res.json({ success: true, requests });
    } catch (err) { next(err); }
};

// ---- FARMER: most recent verified report ----
exports.myLatestReport = (req, res, next) => {
    try {
        const report = db.prepare(`
            SELECT sr.*, req.farmer_id, f.farm_name, u.name as verified_by
            FROM soil_reports sr
            JOIN soil_requests req ON sr.request_id = req.id
            LEFT JOIN farms f ON req.farm_id = f.id
            LEFT JOIN users u ON sr.government_user_id = u.id
            WHERE req.farmer_id = ? AND sr.verified_at IS NOT NULL
            ORDER BY sr.verified_at DESC LIMIT 1
        `).get(req.user.id);
        res.json({ success: true, report: report || null });
    } catch (err) { next(err); }
};

// ---- GOVERNMENT: list all requests (optionally filter by status) ----
exports.listAllRequests = (req, res, next) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT req.*, u.name as farmer_name, u.phone as farmer_phone, f.farm_name, f.location
            FROM soil_requests req
            JOIN users u ON req.farmer_id = u.id
            LEFT JOIN farms f ON req.farm_id = f.id
        `;
        const params = [];
        if (status) { query += ' WHERE req.status = ?'; params.push(status); }
        query += ' ORDER BY req.requested_at DESC';
        const requests = db.prepare(query).all(...params);
        res.json({ success: true, requests });
    } catch (err) { next(err); }
};

// ---- GOVERNMENT: update request status (e.g. move to processing) ----
exports.updateRequestStatus = (req, res, next) => {
    try {
        const { status } = req.body;
        const valid = ['pending', 'processing', 'completed', 'rejected'];
        if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

        const request = db.prepare('SELECT * FROM soil_requests WHERE id = ?').get(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

        db.prepare('UPDATE soil_requests SET status = ? WHERE id = ?').run(status, req.params.id);
        res.json({ success: true, message: 'Request status updated.' });
    } catch (err) { next(err); }
};

// ---- GOVERNMENT: submit verified soil report for a request ----
exports.submitReport = (req, res, next) => {
    try {
        const { ph, nitrogen, phosphorus, potassium, organic_carbon, moisture, other_parameters, remarks, report_file } = req.body;
        const request = db.prepare('SELECT * FROM soil_requests WHERE id = ?').get(req.params.requestId);
        if (!request) return res.status(404).json({ success: false, message: 'Soil request not found.' });

        const existing = db.prepare('SELECT id FROM soil_reports WHERE request_id = ?').get(request.id);
        let reportId;
        if (existing) {
            db.prepare(`
                UPDATE soil_reports SET ph=?, nitrogen=?, phosphorus=?, potassium=?, organic_carbon=?, moisture=?,
                    other_parameters=?, remarks=?, report_file=?, government_user_id=?, verified_at=CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(ph, nitrogen, phosphorus, potassium, organic_carbon, moisture, other_parameters, remarks, report_file, req.user.id, existing.id);
            reportId = existing.id;
        } else {
            const result = db.prepare(`
                INSERT INTO soil_reports (request_id, government_user_id, ph, nitrogen, phosphorus, potassium, organic_carbon, moisture, other_parameters, remarks, report_file, verified_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(request.id, req.user.id, ph, nitrogen, phosphorus, potassium, organic_carbon, moisture, other_parameters, remarks, report_file);
            reportId = result.lastInsertRowid;
        }

        db.prepare(`UPDATE soil_requests SET status = 'completed' WHERE id = ?`).run(request.id);

        createNotification({
            userId: request.farmer_id,
            title: 'Soil Report Ready',
            message: 'Your verified soil report is ready. Please check it in Soil Report.',
            type: 'soil_report',
            referenceId: reportId
        });

        const report = db.prepare('SELECT * FROM soil_reports WHERE id = ?').get(reportId);
        res.json({ success: true, message: 'Soil report submitted and farmer notified.', report });
    } catch (err) { next(err); }
};

// ---- Shared: get a single request with its report ----
exports.getRequestDetail = (req, res, next) => {
    try {
        const request = db.prepare(`
            SELECT req.*, u.name as farmer_name, u.phone as farmer_phone, f.farm_name, f.location, f.land_area, f.land_unit
            FROM soil_requests req
            JOIN users u ON req.farmer_id = u.id
            LEFT JOIN farms f ON req.farm_id = f.id
            WHERE req.id = ?
        `).get(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

        if (req.user.role === 'farmer' && request.farmer_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const report = db.prepare('SELECT * FROM soil_reports WHERE request_id = ?').get(request.id);
        res.json({ success: true, request, report: report || null });
    } catch (err) { next(err); }
};
