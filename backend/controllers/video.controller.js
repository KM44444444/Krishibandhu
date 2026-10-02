const db = require('../config/database');

exports.list = (req, res, next) => {
    try {
        const { category } = req.query;
        let query = "SELECT * FROM videos WHERE status = 'active'";
        const params = [];
        if (category) { query += ' AND category = ?'; params.push(category); }
        query += ' ORDER BY created_at DESC';
        const videos = db.prepare(query).all(...params);
        res.json({ success: true, videos });
    } catch (err) { next(err); }
};
// ADMIN
exports.listAll = (req, res, next) => {
    try {
        const videos = db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all();
        res.json({ success: true, videos });
    } catch (err) { next(err); }
};

exports.create = (req, res, next) => {
    try {
        const { title, category, youtube_url, description } = req.body;
        if (!title || !youtube_url) return res.status(400).json({ success: false, message: 'Title and YouTube URL are required.' });
        const result = db.prepare(`
            INSERT INTO videos (title, category, youtube_url, description, status) VALUES (?, ?, ?, ?, 'active')
        `).run(title, category || null, youtube_url, description || null);
        res.status(201).json({ success: true, message: 'Video added.', id: result.lastInsertRowid });
    } catch (err) { next(err); }
};

exports.update = (req, res, next) => {
    try {
        const fields = ['title', 'category', 'youtube_url', 'description', 'status'];
        const updates = {};
        fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        if (setClause) db.prepare(`UPDATE videos SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);
        res.json({ success: true, message: 'Video updated.' });
    } catch (err) { next(err); }
};

exports.remove = (req, res, next) => {
    try {
        db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Video removed.' });
    } catch (err) { next(err); }
};
