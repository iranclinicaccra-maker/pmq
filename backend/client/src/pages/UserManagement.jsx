import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { Users, UserPlus, Trash2, Edit } from 'lucide-react';
import UserForm from '../components/UserForm';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const result = await dbQuery('SELECT id, username, full_name, role, created_at FROM users');
            setUsers(result);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setShowModal(true);
    };

    const handleDelete = async (id, username) => {
        if (username === 'admin') {
            alert('Cannot delete the admin user');
            return;
        }

        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await dbQuery('DELETE FROM users WHERE id = ?', [id]);
                fetchUsers();
            } catch (err) {
                console.error('Error deleting user:', err);
                alert('Failed to delete user');
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>User Management</h1>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Add User
                </button>
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Full Name</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.full_name}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        backgroundColor: user.role === 'admin' ? '#e0e7ff' : '#f3f4f6',
                                        color: user.role === 'admin' ? '#4338ca' : '#374151',
                                        fontWeight: '600',
                                        textTransform: 'capitalize'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user.created_at}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '0.25rem 0.5rem' }}
                                            onClick={() => handleEdit(user)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.25rem 0.5rem' }}
                                            disabled={user.username === 'admin'}
                                            onClick={() => handleDelete(user.id, user.username)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <UserForm
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchUsers(); }}
                    initialData={editingUser}
                />
            )}
        </div>
    );
};

export default UserManagement;
