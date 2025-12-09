import { dbQuery } from '../api';

/**
 * Log user activity to the database
 * @param {Object} user - User object with id and full_name/username
 * @param {string} action - Action type: 'create', 'update', 'delete', 'login', 'logout'
 * @param {string} entityType - Type of entity: 'asset', 'work_order', 'pm_plan', 'part', 'user', 'location', 'settings'
 * @param {number|null} entityId - ID of the entity (null for login/logout)
 * @param {string|null} entityName - Name/description of the entity
 * @param {Object|null} changes - Object containing before/after values or created/deleted data
 */
export const logActivity = async (user, action, entityType, entityId, entityName, changes = null) => {
    try {
        if (!user || !user.id) {
            console.warn('Cannot log activity: user not provided');
            return;
        }

        await dbQuery(
            `INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, entity_name, changes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                user.id,
                user.full_name || user.username,
                action,
                entityType,
                entityId,
                entityName,
                changes ? JSON.stringify(changes) : null
            ]
        );
    } catch (err) {
        console.error('Failed to log activity:', err);
        // Don't throw - logging failures shouldn't break the main operation
    }
};

/**
 * Log user login
 */
export const logLogin = async (user) => {
    await logActivity(user, 'login', 'auth', null, user.username, null);
};

/**
 * Log user logout
 */
export const logLogout = async (user) => {
    await logActivity(user, 'logout', 'auth', null, user.username, null);
};

/**
 * Helper to get changes between old and new data
 * @param {Object} oldData - Original data
 * @param {Object} newData - Updated data
 * @returns {Object} Object with before and after values
 */
export const getChanges = (oldData, newData) => {
    const changes = {
        before: {},
        after: {}
    };

    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    allKeys.forEach(key => {
        if (oldData[key] !== newData[key]) {
            changes.before[key] = oldData[key];
            changes.after[key] = newData[key];
        }
    });

    return Object.keys(changes.before).length > 0 ? changes : null;
};
