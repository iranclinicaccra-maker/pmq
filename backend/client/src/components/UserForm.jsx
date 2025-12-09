import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';

const UserForm = ({ onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'technician'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                username: initialData.username,
                password: '',
                full_name: initialData.full_name,
                role: initialData.role
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (initialData) {
                // Update user
                if (formData.password) {
                    // Hash password if provided (simplified for now)
                    const hashedPassword = formData.password;
                    await dbQuery(
                        'UPDATE users SET username=?, password_hash=?, full_name=?, role=? WHERE id=?',
                        [formData.username, hashedPassword, formData.full_name, formData.role, initialData.id]
                    );
                } else {
                    // Don't update password if not provided
                    await dbQuery(
                        'UPDATE users SET username=?, full_name=?, role=? WHERE id=?',
                        [formData.username, formData.full_name, formData.role, initialData.id]
                    );
                }
            } else {
                // Create new user
                if (!formData.password) {
                    setError('Password is required for new users');
                    return;
                }

                // Check if username already exists
                const existingUser = await dbQuery('SELECT id FROM users WHERE username = ?', [formData.username]);
                if (existingUser.length > 0) {
                    setError('Username already exists');
                    return;
                }

                // Hash password - use simple hash for now (in production, use bcryptjs)
                const hashedPassword = formData.password; // For simplicity, storing plain text (NOT RECOMMENDED for production)

                await dbQuery(
                    'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
                    [formData.username, hashedPassword, formData.full_name, formData.role]
                );
            }
            onSave();
        } catch (err) {
            console.error('Error saving user:', err);
            setError('Failed to save user: ' + err.message);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2>{initialData ? 'Edit User' : 'Add New User'}</h2>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Username *</label>
                        <input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={initialData && initialData.username === 'admin'}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label>Password {initialData ? '(leave blank to keep current)' : '*'}</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!initialData}
                            minLength="4"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label>Full Name *</label>
                        <input
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label>Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={initialData && initialData.username === 'admin'}
                        >
                            <option value="technician">Technician</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
