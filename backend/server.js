const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS — allow all in dev, restrict to FRONTEND_URL in production
const corsOptions = {
    origin: NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL || '*')
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// Routes
app.use('/api', apiRoutes);

// Health Check Endpoint (used by Render)
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Upline Backend is running',
        env: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`🚀 Upline Backend running in ${NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown (important for Render)
process.on('SIGTERM', () => {
    console.log('SIGTERM received — shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
