import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dbQuery } from '../api';
import PartForm from '../components/PartForm';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/activityLogger';

const Parts = () => {
    const { user } = useAuth();
    const [parts, setParts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPart, setEditingPart] = useState(null);
    const [filter, setFilter] = useState('');

    const fetchParts = async () => {
        try {
            const result = await dbQuery('SELECT * FROM parts ORDER BY name ASC');
            setParts(result);
        } catch (err) {
            console.error('Error fetching parts:', err);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this part?')) {
            // Get part details before deletion
            const part = parts.find(p => p.id === id);

            await dbQuery('DELETE FROM parts WHERE id = ?', [id]);

            // Log the deletion
            await logActivity(user, 'delete', 'part', id, part?.name || 'Unknown', { deleted: part });

            fetchParts();
        }
    };

    const handleEdit = (part) => {
        setEditingPart(part);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingPart(null);
        setShowModal(true);
    };

    const location = useLocation();
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('lowStock') === 'true') {
            setShowLowStockOnly(true);
        }
    }, [location.search]);

    const filteredParts = parts.filter(part => {
        const matchesSearch = part.name.toLowerCase().includes(filter.toLowerCase()) ||
            part.part_number?.toLowerCase().includes(filter.toLowerCase());

        if (showLowStockOnly) {
            return matchesSearch && part.quantity <= part.min_quantity;
        }
        return matchesSearch;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Inventory (Parts)</h1>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    + Add Part
                </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search parts..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ maxWidth: '400px', flex: 1 }}
                />
                {showLowStockOnly && (
                    <button className="btn btn-outline" onClick={() => setShowLowStockOnly(false)}>
                        Clear "Low Stock" Filter
                    </button>
                )}
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Part Number</th>
                            <th>Quantity</th>
                            <th>Min Qty</th>
                            <th>Cost</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParts.map((part) => (
                            <tr key={part.id}>
                                <td>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden',
                                        backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {part.image_url ? (
                                            <img
                                                src={part.image_url.startsWith('data:') ? part.image_url : `file://${part.image_url}`}
                                                alt={part.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>No Img</span>
                                        )}
                                    </div>
                                </td>
                                <td>{part.name}</td>
                                <td>{part.part_number}</td>
                                <td>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: part.quantity <= part.min_quantity ? 'var(--danger-color)' : 'inherit'
                                    }}>
                                        {part.quantity}
                                    </span>
                                    {part.quantity <= part.min_quantity && (
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            fontSize: '0.75rem',
                                            backgroundColor: '#fee2e2',
                                            color: '#ef4444',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: '4px'
                                        }}>
                                            Low Stock
                                        </span>
                                    )}
                                </td>
                                <td>{part.min_quantity}</td>
                                <td>${part.cost}</td>
                                <td>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => handleEdit(part)}>Edit</button>
                                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(part.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <PartForm
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchParts(); }}
                    initialData={editingPart}
                />
            )}
        </div>
    );
};

export default Parts;
