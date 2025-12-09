const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Get all work orders
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { status, assigned_to } = req.query;
        let query = `
            SELECT w.*, a.name as asset_name, u.full_name as assigned_to_name
            FROM work_orders w
            LEFT JOIN assets a ON w.asset_id = a.id
            LEFT JOIN users u ON w.assigned_to = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (status && status !== 'all') {
            query += ` AND w.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (assigned_to) {
            query += ` AND w.assigned_to = $${paramCount}`;
            params.push(assigned_to);
            paramCount++;
        }

        query += ` ORDER BY w.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single work order
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT w.*, a.name as asset_name, u.full_name as assigned_to_name
            FROM work_orders w
            LEFT JOIN assets a ON w.asset_id = a.id
            LEFT JOIN users u ON w.assigned_to = u.id
            WHERE w.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Work order not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create work order
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO work_orders (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update work order
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        let setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

        const query = `UPDATE work_orders SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
        const result = await pool.query(query, [...values, req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Work order not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete work order
router.delete('/:id', hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM work_orders WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Work order not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
