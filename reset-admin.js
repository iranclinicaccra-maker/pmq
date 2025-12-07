const { pool } = require('./server/config/database');
const bcrypt = require('bcrypt');

async function resetAdmin() {
    try {
        console.log('Connecting to database...');

        // Hash password 'admin'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt);

        console.log('Resetting admin user...');

        // Check if user exists
        const check = await pool.query("SELECT * FROM users WHERE username = 'admin'");

        if (check.rows.length > 0) {
            // Update existing
            await pool.query(
                "UPDATE users SET password_hash = $1, role = 'admin' WHERE username = 'admin'",
                [hashedPassword]
            );
            console.log('✅ Admin user updated successfully.');
        } else {
            // Create new
            await pool.query(
                "INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, 'admin', 'System Administrator')",
                ['admin', hashedPassword]
            );
            console.log('✅ Admin user created successfully.');
        }

        console.log('----------------------------------------');
        console.log('Login with:');
        console.log('Username: admin');
        console.log('Password: admin');
        console.log('----------------------------------------');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

resetAdmin();
