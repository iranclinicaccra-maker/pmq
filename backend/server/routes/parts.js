const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Get all parts
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM parts ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single part
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM parts WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Part not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create part
router.post('/', hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO parts (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update part
router.put('/:id', hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        let setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

        const query = `UPDATE parts SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
        const result = await pool.query(query, [...values, req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Part not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete part
router.delete('/:id', hasRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM parts WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Part not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
