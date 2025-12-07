const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// Generic Query Endpoint
// WARNING: This allows raw SQL execution. In a strict production environment, 
// you should replace this with specific API endpoints for each action.
// This is provided to facilitate easier migration from the Electron app.
router.post('/', isAuthenticated, async (req, res) => {
    const { sql, params } = req.body;

    let convertedSql = sql;
    let convertedParams = params;

    try {
        // Convert SQLite style placeholders (?) to PostgreSQL style ($1, $2, ...)
        let paramIndex = 1;
        while (convertedSql.includes('?')) {
            convertedSql = convertedSql.replace('?', `$${paramIndex}`);
            paramIndex++;
        }

        // Convert boolean literals in SQL (for is_read column)
        // Replace "= 0" with "= false" and "= 1" with "= true" for boolean columns
        convertedSql = convertedSql.replace(/is_read\s*=\s*0/gi, 'is_read = false');
        convertedSql = convertedSql.replace(/is_read\s*=\s*1/gi, 'is_read = true');

        // Basic SQL injection prevention is handled by pg's parameterized queries
        const result = await pool.query(convertedSql, convertedParams);
        res.json(result.rows);
    } catch (err) {
        console.error('SQL Error:', err);
        console.error('Original SQL:', sql);
        console.error('Converted SQL:', convertedSql);
        console.error('Params:', params);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
