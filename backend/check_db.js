const { pool } = require('./server/config/database');

async function check() {
    try {
        const wos = await pool.query("SELECT COUNT(id) as count FROM work_orders WHERE due_date BETWEEN '2025-12-01' AND '2025-12-31'");
        console.log('WOs in Dec 2025:', wos.rows[0].count);

        const pms = await pool.query("SELECT COUNT(id) as count FROM pm_plans WHERE next_due_date BETWEEN '2025-12-01' AND '2025-12-31'");
        console.log('PMs in Dec 2025:', pms.rows[0].count);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
