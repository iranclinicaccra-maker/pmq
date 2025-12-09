const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// Dashboard stats
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Total Equipment
        const totalResult = await pool.query('SELECT COUNT(*) as count FROM assets');

        // Operational
        const operationalResult = await pool.query("SELECT COUNT(*) as count FROM assets WHERE status = 'active'");

        // Calibration Overdue
        const overdueResult = await pool.query(`
            SELECT COUNT(*) as count 
            FROM assets 
            WHERE next_calibration_date IS NOT NULL 
            AND next_calibration_date < $1
        `, [today]);

        // Under Maintenance
        const maintenanceResult = await pool.query("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'");

        // Out of Service
        const outOfServiceResult = await pool.query("SELECT COUNT(*) as count FROM assets WHERE status IN ('retired', 'broken')");

        // Disposed
        const disposedResult = await pool.query("SELECT COUNT(*) as count FROM assets WHERE status = 'disposed'");

        // Active Work Orders
        const ticketsResult = await pool.query("SELECT COUNT(*) as count FROM work_orders WHERE status IN ('open', 'in_progress', 'on_hold')");

        res.json({
            totalEquipment: parseInt(totalResult.rows[0].count),
            operational: parseInt(operationalResult.rows[0].count),
            calibrationOverdue: parseInt(overdueResult.rows[0].count),
            underMaintenance: parseInt(maintenanceResult.rows[0].count),
            outOfService: parseInt(outOfServiceResult.rows[0].count),
            disposed: parseInt(disposedResult.rows[0].count),
            openServiceTickets: parseInt(ticketsResult.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
