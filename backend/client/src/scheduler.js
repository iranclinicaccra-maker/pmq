import { dbQuery } from './api';

export const runScheduler = async () => {
    console.log('Running PM Scheduler...');
    try {
        const today = new Date().toISOString().split('T')[0];

        // Find PM plans due today or earlier
        const duePlans = await dbQuery(`
      SELECT * FROM pm_plans 
      WHERE next_due_date <= ?
    `, [today]);

        for (const plan of duePlans) {
            // Check if an open WO already exists for this plan/asset to avoid duplicates
            // We can check description or add a column to link WO to PM Plan. 
            // For now, we'll check if there is an open PM WO for this asset created today.

            const existingWO = await dbQuery(`
        SELECT id FROM work_orders 
        WHERE asset_id = ? AND type = 'pm' AND status != 'closed' AND status != 'completed'
      `, [plan.asset_id]);

            if (existingWO.length === 0) {
                console.log(`Generating WO for PM Plan: ${plan.title}`);

                // Create Work Order
                await dbQuery(`
          INSERT INTO work_orders (
            asset_id, type, priority, status, description, due_date
          ) VALUES (?, 'pm', 'medium', 'open', ?, ?)
        `, [plan.asset_id, `PM: ${plan.title}`, plan.next_due_date]);

                // Update next_due_date for the plan
                const nextDate = new Date(plan.next_due_date);
                nextDate.setDate(nextDate.getDate() + plan.frequency_days);
                const nextDateStr = nextDate.toISOString().split('T')[0];

                await dbQuery('UPDATE pm_plans SET next_due_date = ? WHERE id = ?', [nextDateStr, plan.id]);
            }
        }
    } catch (err) {
        console.error('Scheduler error:', err);
    }
};
