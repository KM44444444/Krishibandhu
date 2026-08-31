const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

const VALID_ROLES = ['farmer', 'government', 'admin', 'buyer', 'seller', 'expert'];

function signToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

exports.register = (req, res, next) => {
    try {
        const { name, email, password, phone, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
        }
        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
        }
        if (role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin accounts cannot be created through registration.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const hashed = bcrypt.hashSync(password, 10);
        const result = db.prepare(
            `INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)`
        ).run(name, email, hashed, phone || null, role);

        const user = db.prepare('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
        const token = signToken(user);

        res.status(201).json({ success: true, message: 'Account created successfully.', token, user });
    } catch (err) {
        next(err);
    }
};

exports.login = (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        if (user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'This account has been deactivated. Contact the admin.' });
        }

        const match = bcrypt.compareSync(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = signToken(user);
        delete user.password;

        res.json({ success: true, message: 'Login successful.', token, user });
    } catch (err) {
        next(err);
    }
};

exports.me = (req, res, next) => {
    try {
        const user = db.prepare('SELECT id, name, email, phone, role, status, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

exports.updateProfile = (req, res, next) => {
    try {
        const { name, phone, avatar_url } = req.body;
        db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?')
            .run(name, phone, avatar_url, req.user.id);
        const user = db.prepare('SELECT id, name, email, phone, role, status, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
        res.json({ success: true, message: 'Profile updated.', user });
    } catch (err) {
        next(err);
    }
};
