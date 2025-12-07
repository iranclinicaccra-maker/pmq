const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Get all assets
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = `
      SELECT a.*, l.name as location_name 
      FROM assets a 
      LEFT JOIN locations l ON a.location_id = l.id 
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (status && status !== 'all') {
            if (status === 'overdue') {
                query += ` AND (a.next_calibration_date < CURRENT_DATE OR a.next_calibration_date IS NULL)`;
            } else {
                query += ` AND a.status = $${paramCount}`;
                params.push(status);
                paramCount++;
            }
        }

        if (search) {
            query += ` AND (a.name ILIKE $${paramCount} OR a.serial_number ILIKE $${paramCount} OR a.model ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY a.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single asset
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT a.*, l.name as location_name 
      FROM assets a 
      LEFT JOIN locations l ON a.location_id = l.id 
      WHERE a.id = $1
    `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create asset
router.post('/', hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO assets (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating asset:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Update asset
router.put('/:id', hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        let setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

        const query = `UPDATE assets SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
        const result = await pool.query(query, [...values, req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete asset
router.delete('/:id', hasRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
