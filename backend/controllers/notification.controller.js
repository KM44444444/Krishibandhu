const db = require('../config/database');

exports.list = (req, res, next) => {
    try {
        const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
        const unreadCount = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).c;
        res.json({ success: true, notifications, unreadCount });
    } catch (err) { next(err); }
};

exports.markRead = (req, res, next) => {
    try {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        res.json({ success: true, message: 'Marked as read.' });
    } catch (err) { next(err); }
};

exports.markAllRead = (req, res, next) => {
    try {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) { next(err); }
};
