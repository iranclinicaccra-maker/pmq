const { pool } = require('./server/config/database');

async function checkUser() {
    try {
        const result = await pool.query('SELECT username, password_hash FROM users WHERE username = $1', ['admin']);
        console.log('User data:', result.rows);
        await pool.end();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUser();
