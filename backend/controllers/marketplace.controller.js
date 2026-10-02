const db = require('../config/database');
// PUBLIC (any logged-in user): browse products
exports.browseProducts = (req, res, next) => {
    try {
        const { category, search } = req.query;
        let query = `
            SELECT p.*, u.name as seller_name FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.status = 'active'
        `;
        const params = [];
        if (category) { query += ' AND p.category = ?'; params.push(category); }
        if (search) { query += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
        query += ' ORDER BY p.created_at DESC';
        const products = db.prepare(query).all(...params);
        res.json({ success: true, products });
    } catch (err) { next(err); }
};

exports.getProduct = (req, res, next) => {
    try {
        const product = db.prepare(`
            SELECT p.*, u.name as seller_name, u.phone as seller_phone FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.id = ?
        `).get(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
        res.json({ success: true, product });
    } catch (err) { next(err); }
};
// SELLER: manage own products
exports.myProducts = (req, res, next) => {
    try {
        const products = db.prepare('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json({ success: true, products });
    } catch (err) { next(err); }
};

exports.createProduct = (req, res, next) => {
    try {
        const { name, description, category, price, stock, image_url } = req.body;
        if (!name || price == null) return res.status(400).json({ success: false, message: 'Name and price are required.' });
        const result = db.prepare(`
            INSERT INTO products (seller_id, name, description, category, price, stock, image_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `).run(req.user.id, name, description || null, category || null, price, stock || 0, image_url || null);
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, message: 'Product listed.', product });
    } catch (err) { next(err); }
};

exports.updateProduct = (req, res, next) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?').get(req.params.id, req.user.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        const fields = ['name', 'description', 'category', 'price', 'stock', 'image_url', 'status'];
        const updates = {};
        fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        if (setClause) db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);

        const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        res.json({ success: true, message: 'Product updated.', product: updated });
    } catch (err) { next(err); }
};

exports.deleteProduct = (req, res, next) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?').get(req.params.id, req.user.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Product removed.' });
    } catch (err) { next(err); }
};
