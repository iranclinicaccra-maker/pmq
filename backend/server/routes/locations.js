const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Get all locations (hierarchical)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single location
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create location
router.post('/', hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const { name, parent_id } = req.body;
        const result = await pool.query(
            'INSERT INTO locations (name, parent_id) VALUES ($1, $2) RETURNING *',
            [name, parent_id || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update location
router.put('/:id', hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const { name, parent_id } = req.body;
        const result = await pool.query(
            'UPDATE locations SET name = $1, parent_id = $2 WHERE id = $3 RETURNING *',
            [name, parent_id || null, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete location
router.delete('/:id', hasRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
