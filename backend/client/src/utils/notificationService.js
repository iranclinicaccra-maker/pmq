import { dbQuery } from '../api';

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, type, category, title, message, link = null) => {
    try {
        await dbQuery(
            `INSERT INTO notifications (user_id, type, category, title, message, link)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, type, category, title, message, link]
        );
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
};

/**
 * Get unread notifications for a user
 */
export const getUnreadNotifications = async (userId) => {
    try {
        return await dbQuery(
            `SELECT * FROM notifications 
             WHERE user_id = ? AND is_read = 0 
             ORDER BY created_at DESC`,
            [userId]
        );
    } catch (err) {
        console.error('Failed to get notifications:', err);
        return [];
    }
};

/**
 * Get all notifications for a user
 */
export const getAllNotifications = async (userId, limit = 50) => {
    try {
        return await dbQuery(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, limit]
        );
    } catch (err) {
        console.error('Failed to get notifications:', err);
        return [];
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
    try {
        await dbQuery(
            `UPDATE notifications SET is_read = 1 WHERE id = ?`,
            [notificationId]
        );
    } catch (err) {
        console.error('Failed to mark notification as read:', err);
    }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
    try {
        await dbQuery(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
            [userId]
        );
    } catch (err) {
        console.error('Failed to mark all as read:', err);
    }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
    try {
        await dbQuery(`DELETE FROM notifications WHERE id = ?`, [notificationId]);
    } catch (err) {
        console.error('Failed to delete notification:', err);
    }
};

/**
 * Check for overdue work orders and create notifications
 */
export const notifyOverdueWorkOrders = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const overdueWOs = await dbQuery(
            `SELECT wo.id, wo.description, wo.assigned_to, a.name as asset_name
             FROM work_orders wo
             LEFT JOIN assets a ON wo.asset_id = a.id
             WHERE wo.due_date < ? AND wo.status NOT IN ('completed', 'closed')`,
            [today]
        );

        for (const wo of overdueWOs) {
            if (wo.assigned_to) {
                await createNotification(
                    wo.assigned_to,
                    'warning',
                    'work_order',
                    'Overdue Work Order',
                    `Work order "${wo.description || wo.asset_name}" is overdue`,
                    `/work-orders/${wo.id}`
                );
            }
        }
    } catch (err) {
        console.error('Failed to check overdue work orders:', err);
    }
};

/**
 * Check for upcoming calibrations and create notifications
 */
export const notifyUpcomingCalibrations = async (daysAhead = 30) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        const upcomingCals = await dbQuery(
            `SELECT id, name, next_calibration_date
             FROM assets
             WHERE next_calibration_date BETWEEN ? AND ?
             AND next_calibration_date IS NOT NULL`,
            [today, futureDateStr]
        );

        // Get all admin and manager users
        const users = await dbQuery(
            `SELECT id FROM users WHERE role IN ('admin', 'manager')`
        );

        for (const asset of upcomingCals) {
            for (const user of users) {
                await createNotification(
                    user.id,
                    'info',
                    'calibration',
                    'Upcoming Calibration',
                    `Equipment "${asset.name}" calibration due on ${asset.next_calibration_date}`,
                    `/equipment/${asset.id}`
                );
            }
        }
    } catch (err) {
        console.error('Failed to check upcoming calibrations:', err);
    }
};

/**
 * Check for low stock parts and create notifications
 */
export const notifyLowStock = async () => {
    try {
        const lowStockParts = await dbQuery(
            `SELECT id, name, quantity, min_quantity
             FROM parts
             WHERE quantity <= min_quantity`
        );

        // Get all admin and manager users
        const users = await dbQuery(
            `SELECT id FROM users WHERE role IN ('admin', 'manager')`
        );

        for (const part of lowStockParts) {
            for (const user of users) {
                await createNotification(
                    user.id,
                    'warning',
                    'inventory',
                    'Low Stock Alert',
                    `Part "${part.name}" is low on stock (${part.quantity}/${part.min_quantity})`,
                    `/parts`
                );
            }
        }
    } catch (err) {
        console.error('Failed to check low stock:', err);
    }
};

/**
 * Check for upcoming PM plans and create notifications
 */
export const notifyUpcomingPMs = async (daysAhead = 7) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        const upcomingPMs = await dbQuery(
            `SELECT p.id, p.title, p.next_due_date, a.name as asset_name
             FROM pm_plans p
             JOIN assets a ON p.asset_id = a.id
             WHERE p.next_due_date BETWEEN ? AND ?`,
            [today, futureDateStr]
        );

        // Get all users who can perform maintenance
        const users = await dbQuery(
            `SELECT id FROM users WHERE role IN ('admin', 'manager', 'technician')`
        );

        for (const pm of upcomingPMs) {
            for (const user of users) {
                await createNotification(
                    user.id,
                    'info',
                    'pm',
                    'Upcoming PM',
                    `PM "${pm.title}" for ${pm.asset_name} due on ${pm.next_due_date}`,
                    `/pms`
                );
            }
        }
    } catch (err) {
        console.error('Failed to check upcoming PMs:', err);
    }
};

/**
 * Run all notification checks
 */
export const generateNotifications = async () => {
    await notifyOverdueWorkOrders();
    await notifyUpcomingCalibrations();
    await notifyLowStock();
    await notifyUpcomingPMs();
};
