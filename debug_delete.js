const { pool } = require('./server/config/database');

async function testDelete() {
    try {
        console.log('Testing DELETE operations...');

        // 1. Create a dummy asset
        console.log('Creating dummy asset...');
        const assetRes = await pool.query("INSERT INTO assets (name, status) VALUES ('Test Delete Asset', 'active') RETURNING id");
        const assetId = assetRes.rows[0].id;
        console.log('Dummy asset created, ID:', assetId);

        // 2. Create a dummy work order linked to it
        console.log('Creating dummy work order...');
        const woRes = await pool.query("INSERT INTO work_orders (asset_id, description, status, type) VALUES ($1, 'Test WO', 'open', 'repair') RETURNING id", [assetId]);
        const woId = woRes.rows[0].id;
        console.log('Dummy WO created, ID:', woId);

        // 3. Try to delete the asset (Should fail due to FK if no Cascade)
        console.log('Attempting to delete asset (Expect FK failure)...');
        try {
            await pool.query("DELETE FROM assets WHERE id = $1", [assetId]);
            console.log('SUCCESS: Asset deleted (Unexpected if FK exists)');
        } catch (err) {
            console.log('EXPECTED ERROR deleting asset:', err.message);
        }

        // 4. Try to delete the WO (Should succeed)
        console.log('Attempting to delete WO...');
        try {
            await pool.query("DELETE FROM work_orders WHERE id = $1", [woId]);
            console.log('SUCCESS: Work Order deleted');
        } catch (err) {
            console.error('ERROR deleting WO:', err);
        }

        // 5. Try to delete the asset again (Should succeed now)
        console.log('Attempting to delete asset again...');
        try {
            await pool.query("DELETE FROM assets WHERE id = $1", [assetId]);
            console.log('SUCCESS: Asset deleted');
        } catch (err) {
            console.error('ERROR deleting asset:', err);
        }

    } catch (err) {
        console.error('Setup error:', err);
    } finally {
        process.exit(0);
    }
}

testDelete();
