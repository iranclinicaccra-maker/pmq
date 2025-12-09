import React, { useState, useEffect } from 'react';
import { Save, Database, Info, RotateCcw, Bell, DollarSign, HardDrive, FolderOpen } from 'lucide-react';
import { dbQuery } from '../api';

const Settings = () => {
    const [settings, setSettings] = useState({
        notification_window_days: 30,
        default_currency: 'USD',
        data_storage: 'server', // Always 'server' for web version
        auto_backup_enabled: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dbPath] = useState('PostgreSQL Database (Web Version)');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const result = await dbQuery('SELECT * FROM app_settings WHERE id = 1');
            if (result && result.length > 0) {
                setSettings({
                    notification_window_days: result[0].notification_window_days,
                    default_currency: result[0].default_currency,
                    data_storage: 'server',
                    auto_backup_enabled: result[0].auto_backup_enabled === 1 || result[0].auto_backup_enabled === true
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await dbQuery(
                'UPDATE app_settings SET notification_window_days=?, default_currency=?, data_storage=?, auto_backup_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=1',
                [settings.notification_window_days, settings.default_currency, settings.data_storage, settings.auto_backup_enabled ? 1 : 0]
            );
            alert('Settings saved successfully!');
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleBackup = async () => {
        alert('Database backup is managed by your server administrator in the web version.');
    };

    const handleRestore = async () => {
        alert('Database restore is managed by your server administrator in the web version.');
    };

    const handleOpenFolder = async () => {
        alert('Database folder access is not available in web version. Contact your server administrator.');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Application Settings</h1>

            {/* Notifications */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <Bell size={24} style={{ marginRight: '0.75rem', color: 'var(--primary-color)' }} />
                    <h2 style={{ margin: 0 }}>Notifications</h2>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        Upcoming Maintenance Alert Window (Days)
                    </label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        Show alerts on the dashboard for equipment needing calibration within this many days.
                    </p>
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={settings.notification_window_days}
                        onChange={(e) => handleChange('notification_window_days', e.target.value)}
                        style={{ maxWidth: '200px' }}
                    />
                </div>
            </div>

            {/* Currency Settings */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <DollarSign size={24} style={{ marginRight: '0.75rem', color: 'var(--primary-color)' }} />
                    <h2 style={{ margin: 0 }}>Currency Settings</h2>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        Default Currency
                    </label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        Select the default currency for new repair cost entries.
                    </p>
                    <select
                        value={settings.default_currency}
                        onChange={(e) => handleChange('default_currency', e.target.value)}
                        style={{ maxWidth: '300px' }}
                    >
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="IRR">Iranian Rial (IRR)</option>
                        <option value="AED">UAE Dirham (AED)</option>
                        <option value="SAR">Saudi Riyal (SAR)</option>
                        <option value="GHS">Ghanaian Cedi (GHS)</option>
                    </select>
                </div>
            </div>

            {/* Data Storage */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <HardDrive size={24} style={{ marginRight: '0.75rem', color: 'var(--primary-color)' }} />
                    <h2 style={{ margin: 0 }}>Data Storage</h2>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Choose where to store application data. For a multi-user or centralized system, a server option would be required.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="data_storage"
                            value="local"
                            checked={settings.data_storage === 'local'}
                            onChange={(e) => handleChange('data_storage', e.target.value)}
                            style={{ marginRight: '0.5rem' }}
                        />
                        <span style={{ fontWeight: '500' }}>Local Browser</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="data_storage"
                            value="server"
                            checked={settings.data_storage === 'server'}
                            onChange={(e) => handleChange('data_storage', e.target.value)}
                            style={{ marginRight: '0.5rem' }}
                        />
                        <span style={{ fontWeight: '500' }}>Server (Simulated)</span>
                    </label>
                </div>

                {/* Database Location */}
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                }}>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block', fontSize: '0.875rem' }}>
                        Database Location
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            value={dbPath}
                            disabled
                            style={{
                                flex: 1,
                                fontSize: '0.75rem',
                                backgroundColor: 'white',
                                color: '#64748b'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleSaveSettings}
                    disabled={saving}
                    style={{ minWidth: '150px' }}
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Application Information */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <Info size={24} style={{ marginRight: '0.75rem', color: 'var(--primary-color)' }} />
                    <h2 style={{ margin: 0 }}>Application Information</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label>Application Name</label>
                        <input value="Medical PM Manager" disabled />
                    </div>
                    <div>
                        <label>Version</label>
                        <input value="1.0.0" disabled />
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <Database size={24} style={{ marginRight: '0.75rem', color: 'var(--primary-color)' }} />
                    <h2 style={{ margin: 0 }}>Data Management</h2>
                </div>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Manage your application data, create backups, or restore from a previous state.
                </p>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.auto_backup_enabled}
                            onChange={(e) => handleChange('auto_backup_enabled', e.target.checked)}
                            style={{ marginRight: '0.75rem', width: '1.25rem', height: '1.25rem' }}
                        />
                        <div>
                            <div style={{ fontWeight: '600' }}>Enable Automatic Weekly Backup</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Automatically backs up the database once a week to the <code>backups</code> folder.
                            </div>
                        </div>
                    </label>
                </div>

                <button className="btn btn-primary" onClick={handleBackup} style={{ marginRight: '1rem' }}>
                    <Save size={18} /> Backup Database
                </button>
                <button className="btn btn-danger" onClick={handleRestore}>
                    <RotateCcw size={18} /> Restore Database
                </button>
            </div>
        </div>
    );
};

export default Settings;
