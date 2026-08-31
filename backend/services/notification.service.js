const db = require('../config/database');

function createNotification({ userId, title, message, type, referenceId = null }) {
    const stmt = db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_id)
        VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(userId, title, message, type, referenceId);
}

module.exports = { createNotification };
