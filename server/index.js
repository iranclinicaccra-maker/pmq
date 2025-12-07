const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const dotenv = require('dotenv');
const { pool } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable for development/simplicity, enable in strict prod
}));
app.use(compression());
app.use(cors({
    origin: true, // Allow all origins for now, restrict in production
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session Configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    name: 'pmq.sid',
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: false, // Set to false for localhost
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Static Files
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/work-orders', require('./routes/work-orders'));
app.use('/api/parts', require('./routes/parts'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/pm-plans', require('./routes/pm-plans'));
app.use('/api/activity-log', require('./routes/activity-log'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/query', require('./routes/query'));
app.use('/api/uploads', require('./routes/uploads'));

// SPA Fallback
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
