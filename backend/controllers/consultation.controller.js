const db = require('../config/database');
const { createNotification } = require('../services/notification.service');

// ---- FARMER: start a new consultation (chat / consultation / video) ----
exports.createConsultation = (req, res, next) => {
    try {
        const { type, subject, expert_id } = req.body;
        const validTypes = ['chat', 'consultation', 'video'];
        if (!validTypes.includes(type)) return res.status(400).json({ success: false, message: 'Invalid consultation type.' });

        const result = db.prepare(`
            INSERT INTO consultations (farmer_id, expert_id, type, subject, status)
            VALUES (?, ?, ?, ?, ?)
        `).run(req.user.id, expert_id || null, type, subject || null, expert_id ? 'assigned' : 'open');

        const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(result.lastInsertRowid);

        if (expert_id) {
            createNotification({
                userId: expert_id,
                title: 'New Consultation Request',
                message: `A farmer requested a ${type}.`,
                type: 'consultation',
                referenceId: consultation.id
            });
        }

        res.status(201).json({ success: true, message: 'Request submitted.', consultation });
    } catch (err) { next(err); }
};

// ---- FARMER: my consultations ----
exports.myConsultations = (req, res, next) => {
    try {
        const consultations = db.prepare(`
            SELECT c.*, u.name as expert_name FROM consultations c
            LEFT JOIN users u ON c.expert_id = u.id
            WHERE c.farmer_id = ?
            ORDER BY c.created_at DESC
        `).all(req.user.id);
        res.json({ success: true, consultations });
    } catch (err) { next(err); }
};

// ---- EXPERT: consultations assigned to / open for me ----
exports.expertConsultations = (req, res, next) => {
    try {
        const consultations = db.prepare(`
            SELECT c.*, u.name as farmer_name, u.phone as farmer_phone FROM consultations c
            JOIN users u ON c.farmer_id = u.id
            WHERE c.expert_id = ? OR c.status = 'open'
            ORDER BY c.created_at DESC
        `).all(req.user.id);
        res.json({ success: true, consultations });
    } catch (err) { next(err); }
};

// ---- EXPERT: accept an open consultation ----
exports.acceptConsultation = (req, res, next) => {
    try {
        const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id);
        if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });

        db.prepare(`UPDATE consultations SET expert_id = ?, status = 'in_progress' WHERE id = ?`).run(req.user.id, req.params.id);

        createNotification({
            userId: consultation.farmer_id,
            title: 'Expert Assigned',
            message: `${req.user.name} accepted your consultation request.`,
            type: 'consultation',
            referenceId: consultation.id
        });

        res.json({ success: true, message: 'Consultation accepted.' });
    } catch (err) { next(err); }
};

exports.updateConsultationStatus = (req, res, next) => {
    try {
        const { status } = req.body;
        const valid = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'];
        if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
        db.prepare('UPDATE consultations SET status = ? WHERE id = ?').run(status, req.params.id);
        res.json({ success: true, message: 'Status updated.' });
    } catch (err) { next(err); }
};

// ---- Messages within a consultation (used for chat) ----
exports.getMessages = (req, res, next) => {
    try {
        const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id);
        if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });
        if (req.user.role === 'farmer' && consultation.farmer_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        if (req.user.role === 'expert' && consultation.expert_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const messages = db.prepare(`
            SELECT m.*, u.name as sender_name, u.role as sender_role FROM consultation_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.consultation_id = ?
            ORDER BY m.created_at ASC
        `).all(req.params.id);
        res.json({ success: true, consultation, messages });
    } catch (err) { next(err); }
};

exports.sendMessage = (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty.' });

        const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id);
        if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });

        db.prepare(`INSERT INTO consultation_messages (consultation_id, sender_id, message) VALUES (?, ?, ?)`)
            .run(req.params.id, req.user.id, message.trim());

        // Notify the other party
        const recipientId = req.user.id === consultation.farmer_id ? consultation.expert_id : consultation.farmer_id;
        if (recipientId) {
            createNotification({
                userId: recipientId,
                title: 'Expert Replied',
                message: req.user.role === 'expert' ? `${req.user.name} replied to your question.` : `New message from ${req.user.name}.`,
                type: 'consultation',
                referenceId: consultation.id
            });
        }

        const messages = db.prepare(`
            SELECT m.*, u.name as sender_name, u.role as sender_role FROM consultation_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.consultation_id = ?
            ORDER BY m.created_at ASC
        `).all(req.params.id);

        res.status(201).json({ success: true, messages });
    } catch (err) { next(err); }
};
