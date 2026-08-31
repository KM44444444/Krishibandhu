const db = require('../config/database');
const { createNotification } = require('../services/notification.service');

// ---- BUYER (or farmer): place an order ----
// body: { items: [{ product_id, quantity }] }
exports.createOrder = (req, res, next) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
        }

        let total = 0;
        const resolvedItems = [];
        for (const item of items) {
            const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(item.product_id, 'active');
            if (!product) return res.status(404).json({ success: false, message: `Product ${item.product_id} not found or unavailable.` });
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` });
            }
            total += product.price * item.quantity;
            resolvedItems.push({ product, quantity: item.quantity });
        }

        const orderResult = db.prepare(`INSERT INTO orders (buyer_id, total_amount, status) VALUES (?, ?, 'pending')`)
            .run(req.user.id, total);
        const orderId = orderResult.lastInsertRowid;

        const insertItem = db.prepare(`INSERT INTO order_items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, ?, ?)`);
        const decrementStock = db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`);
        const notifiedSellers = new Set();

        resolvedItems.forEach(({ product, quantity }) => {
            insertItem.run(orderId, product.id, product.seller_id, quantity, product.price);
            decrementStock.run(quantity, product.id);
            if (!notifiedSellers.has(product.seller_id)) {
                createNotification({
                    userId: product.seller_id,
                    title: 'New Marketplace Order',
                    message: `You have a new order (#ORD${orderId}) for ${product.name}.`,
                    type: 'order',
                    referenceId: orderId
                });
                notifiedSellers.add(product.seller_id);
            }
        });

        createNotification({
            userId: req.user.id,
            title: 'Order Confirmed',
            message: `Your order #ORD${orderId} has been placed.`,
            type: 'order',
            referenceId: orderId
        });

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        res.status(201).json({ success: true, message: 'Order placed successfully.', order });
    } catch (err) { next(err); }
};

// ---- BUYER: my orders ----
exports.myOrders = (req, res, next) => {
    try {
        const orders = db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC').all(req.user.id);
        const items = db.prepare(`
            SELECT oi.*, p.name as product_name, p.image_url FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `);
        const withItems = orders.map(o => ({ ...o, items: items.all(o.id) }));
        res.json({ success: true, orders: withItems });
    } catch (err) { next(err); }
};

exports.getOrder = (req, res, next) => {
    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        const items = db.prepare(`
            SELECT oi.*, p.name as product_name, p.image_url FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `).all(order.id);
        res.json({ success: true, order: { ...order, items } });
    } catch (err) { next(err); }
};

// ---- SELLER: orders containing my products ----
exports.sellerOrders = (req, res, next) => {
    try {
        const items = db.prepare(`
            SELECT oi.*, o.status as order_status, o.created_at as order_date, p.name as product_name,
                   u.name as buyer_name, u.phone as buyer_phone
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            JOIN users u ON o.buyer_id = u.id
            WHERE oi.seller_id = ?
            ORDER BY o.created_at DESC
        `).all(req.user.id);
        res.json({ success: true, items });
    } catch (err) { next(err); }
};

// ---- SELLER/ADMIN: update order status ----
exports.updateOrderStatus = (req, res, next) => {
    try {
        const { status } = req.body;
        const valid = ['pending', 'accepted', 'shipped', 'delivered', 'cancelled'];
        if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

        createNotification({
            userId: order.buyer_id,
            title: 'Order Status Updated',
            message: `Your order #ORD${order.id} is now "${status}".`,
            type: 'order',
            referenceId: order.id
        });

        res.json({ success: true, message: 'Order status updated.' });
    } catch (err) { next(err); }
};
