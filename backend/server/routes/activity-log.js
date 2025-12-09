const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// Get activity logs
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { entity_type, entity_id, user_id, limit = 100 } = req.query;

        let query = 'SELECT * FROM activity_logs WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (entity_type) {
            query += ` AND entity_type = $${paramCount}`;
            params.push(entity_type);
            paramCount++;
        }

        if (entity_id) {
            query += ` AND entity_id = $${paramCount}`;
            params.push(entity_id);
            paramCount++;
        }

        if (user_id) {
            query += ` AND user_id = $${paramCount}`;
            params.push(user_id);
            paramCount++;
        }

        query += ` ORDER BY timestamp DESC LIMIT $${paramCount}`;
        params.push(limit);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
