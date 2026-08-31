const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

require('./config/database'); // initializes DB + schema on boot

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const farmRoutes = require('./routes/farm.routes');
const soilRoutes = require('./routes/soil.routes');
const cropRoutes = require('./routes/crop.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const orderRoutes = require('./routes/order.routes');
const consultationRoutes = require('./routes/consultation.routes');
const notificationRoutes = require('./routes/notification.routes');
const videoRoutes = require('./routes/video.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'KrishiBandhu API is running.', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/farmer/farms', farmRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🌾 KrishiBandhu API running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
