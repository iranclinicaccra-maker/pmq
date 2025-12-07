const { Pool } = require('pg');
require('dotenv').config();

console.log('--- DIAGNOSTIC START ---');
console.log('Testing Database Connection...');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`Port: ${process.env.DB_PORT}`);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function test() {
    try {
        const client = await pool.connect();
        console.log('✅ Database Connection Successful!');

        const res = await client.query('SELECT NOW()');
        console.log(`🕒 Server Time: ${res.rows[0].now}`);

        console.log('Checking tables...');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log('📂 Found Tables:');
        tables.rows.forEach(row => console.log(` - ${row.table_name}`));

        client.release();
    } catch (err) {
        console.error('❌ Database Connection FAILED:', err.message);
        if (err.code === '28P01') {
            console.error('👉 Hint: Password authentication failed. Check DB_PASSWORD in .env file.');
        } else if (err.code === '3D000') {
            console.error('👉 Hint: Database "pmq_database" does not exist.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('👉 Hint: PostgreSQL is not running or port is wrong.');
        }
    } finally {
        await pool.end();
        console.log('--- DIAGNOSTIC END ---');
    }
}

test();
