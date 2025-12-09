import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { Download, Search, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';

const ActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        user: 'all',
        action: 'all',
        entityType: 'all',
        dateFrom: '',
        dateTo: ''
    });
    const [users, setUsers] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});

    useEffect(() => {
        fetchLogs();
        fetchUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [logs, filters, searchQuery]);

    const fetchLogs = async () => {
        try {
            const result = await dbQuery(`
                SELECT * FROM activity_logs 
                ORDER BY timestamp DESC
                LIMIT 1000
            `);
            setLogs(result);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const result = await dbQuery('SELECT id, full_name, username FROM users ORDER BY full_name');
            setUsers(result);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const applyFilters = () => {
        let filtered = [...logs];

        // Apply user filter
        if (filters.user !== 'all') {
            filtered = filtered.filter(log => log.user_id === parseInt(filters.user));
        }

        // Apply action filter
        if (filters.action !== 'all') {
            filtered = filtered.filter(log => log.action === filters.action);
        }

        // Apply entity type filter
        if (filters.entityType !== 'all') {
            filtered = filtered.filter(log => log.entity_type === filters.entityType);
        }

        // Apply date range filter
        if (filters.dateFrom) {
            filtered = filtered.filter(log => log.timestamp >= filters.dateFrom);
        }
        if (filters.dateTo) {
            const dateTo = new Date(filters.dateTo);
            dateTo.setHours(23, 59, 59, 999);
            filtered = filtered.filter(log => new Date(log.timestamp) <= dateTo);
        }

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(log =>
                (log.user_name || '').toLowerCase().includes(query) ||
                (log.entity_name || '').toLowerCase().includes(query) ||
                (log.action || '').toLowerCase().includes(query) ||
                (log.entity_type || '').toLowerCase().includes(query)
            );
        }

        setFilteredLogs(filtered);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const toggleRowExpansion = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleExport = () => {
        const exportData = filteredLogs.map(log => ({
            'Timestamp': log.timestamp,
            'User': log.user_name,
            'Action': log.action,
            'Entity Type': log.entity_type,
            'Entity Name': log.entity_name || 'N/A',
            'Changes': log.changes ? 'Yes' : 'No'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Activity Log");
        XLSX.writeFile(wb, `activity_log_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'create': return '#10b981';
            case 'update': return '#3b82f6';
            case 'delete': return '#ef4444';
            case 'login': return '#8b5cf6';
            case 'logout': return '#64748b';
            default: return '#64748b';
        }
    };

    const formatChanges = (changesJson) => {
        if (!changesJson) return null;
        try {
            return JSON.parse(changesJson);
        } catch {
            return null;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Activity Log</h1>
                <button className="btn btn-success" onClick={handleExport}>
                    <Download size={18} /> Export
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label>User</label>
                        <select value={filters.user} onChange={(e) => handleFilterChange('user', e.target.value)}>
                            <option value="all">All Users</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name || user.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Action</label>
                        <select value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)}>
                            <option value="all">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                        </select>
                    </div>

                    <div>
                        <label>Entity Type</label>
                        <select value={filters.entityType} onChange={(e) => handleFilterChange('entityType', e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="asset">Asset</option>
                            <option value="work_order">Work Order</option>
                            <option value="pm_plan">PM Plan</option>
                            <option value="part">Part</option>
                            <option value="user">User</option>
                            <option value="location">Location</option>
                            <option value="settings">Settings</option>
                            <option value="auth">Authentication</option>
                        </select>
                    </div>

                    <div>
                        <label>Date From</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        />
                    </div>

                    <div>
                        <label>Date To</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Showing {filteredLogs.length} of {logs.length} activities
            </div>

            {/* Activity Table */}
            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Entity Type</th>
                            <th>Entity Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => {
                            const changes = formatChanges(log.changes);
                            const hasChanges = changes && Object.keys(changes).length > 0;

                            return (
                                <React.Fragment key={log.id}>
                                    <tr style={{ cursor: hasChanges ? 'pointer' : 'default' }} onClick={() => hasChanges && toggleRowExpansion(log.id)}>
                                        <td>
                                            {hasChanges && (
                                                expandedRows[log.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td>{log.user_name}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                backgroundColor: getActionColor(log.action) + '20',
                                                color: getActionColor(log.action),
                                                fontWeight: '600',
                                                textTransform: 'capitalize'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>
                                            {log.entity_type.replace('_', ' ')}
                                        </td>
                                        <td>{log.entity_name || 'N/A'}</td>
                                    </tr>
                                    {expandedRows[log.id] && hasChanges && (
                                        <tr>
                                            <td colSpan="6" style={{ backgroundColor: '#f8fafc', padding: '1rem' }}>
                                                <div style={{ fontSize: '0.875rem' }}>
                                                    <strong>Changes:</strong>
                                                    <pre style={{
                                                        marginTop: '0.5rem',
                                                        padding: '1rem',
                                                        backgroundColor: 'white',
                                                        borderRadius: '4px',
                                                        border: '1px solid #e2e8f0',
                                                        overflow: 'auto',
                                                        maxHeight: '300px'
                                                    }}>
                                                        {JSON.stringify(changes, null, 2)}
                                                    </pre>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>

                {filteredLogs.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No activity logs found
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;
