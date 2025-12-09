import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { useAuth } from '../context/AuthContext';
import { logActivity, getChanges } from '../utils/activityLogger';

const WorkOrderForm = ({ onClose, onSave, initialData }) => {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [parts, setParts] = useState([]);
    const [formData, setFormData] = useState({
        asset_id: '',
        type: 'repair',
        priority: 'medium',
        status: 'open',
        assigned_to: '',
        description: '',
        notes: '',
        cost: 0,
        due_date: new Date().toISOString().split('T')[0]
    });
    const [consumedParts, setConsumedParts] = useState([]);
    const [newPartId, setNewPartId] = useState('');
    const [newPartQty, setNewPartQty] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            const assetsRes = await dbQuery('SELECT id, name FROM assets ORDER BY name ASC');
            setAssets(assetsRes);
            // Fix: Use single quotes for string literals in SQL
            const usersRes = await dbQuery("SELECT id, full_name FROM users WHERE role IN ('technician', 'manager', 'admin')");
            setUsers(usersRes);
            const partsRes = await dbQuery('SELECT id, name, quantity FROM parts ORDER BY name ASC');
            setParts(partsRes);
        };
        fetchData();

        if (initialData) {
            setFormData(initialData);
            // Fetch consumed parts
            const fetchParts = async () => {
                const res = await dbQuery(`
          SELECT wp.*, p.name 
          FROM wo_parts wp 
          JOIN parts p ON wp.part_id = p.id 
          WHERE wp.work_order_id = ?
        `, [initialData.id]);
                setConsumedParts(res);
            };
            fetchParts();
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPart = async () => {
        if (newPartId && newPartQty > 0) {
            // In a real app, we'd check stock here or in backend
            setConsumedParts(prev => [...prev, {
                part_id: newPartId,
                quantity_used: newPartQty,
                name: parts.find(p => p.id == newPartId)?.name
            }]);
            setNewPartId('');
            setNewPartQty(1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let woId;
            // Determine if it's an update (has ID) or insert (no ID)
            const isUpdate = initialData && initialData.id;

            // Sanitize inputs
            const assetId = formData.asset_id ? formData.asset_id : null;
            const assignedTo = formData.assigned_to ? formData.assigned_to : null;
            const completedDate = formData.status === 'completed' ? (formData.completed_date || new Date().toISOString()) : null;

            if (isUpdate) {
                woId = initialData.id;
                await dbQuery(
                    `UPDATE work_orders SET 
            asset_id=?, type=?, priority=?, status=?, assigned_to=?, 
            description=?, notes=?, cost=?, due_date=?, completed_date=?
           WHERE id=?`,
                    [
                        assetId, formData.type, formData.priority, formData.status,
                        assignedTo, formData.description, formData.notes, formData.cost,
                        formData.due_date, completedDate,
                        woId
                    ]
                );

                // Log the update
                const changes = getChanges(initialData, formData);
                const assetName = assets.find(a => a.id == assetId)?.name || 'Unknown';
                await logActivity(user, 'update', 'work_order', woId, `WO #${woId} - ${assetName}`, changes);
            } else {
                const result = await dbQuery(
                    `INSERT INTO work_orders (
            asset_id, type, priority, status, assigned_to, 
            description, notes, cost, due_date, completed_date
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        assetId, formData.type, formData.priority, formData.status,
                        assignedTo, formData.description, formData.notes, formData.cost, formData.due_date, completedDate
                    ]
                );
                woId = result.lastInsertRowid;

                // Log the creation
                const assetName = assets.find(a => a.id == assetId)?.name || 'Unknown';
                await logActivity(user, 'create', 'work_order', woId, `WO #${woId} - ${assetName}`, { created: formData });
            }

            // Save parts
            if (isUpdate) {
                // Clear existing parts to avoid duplicates
                await dbQuery('DELETE FROM wo_parts WHERE work_order_id = ?', [woId]);
            }

            if (consumedParts.length > 0) {
                for (const part of consumedParts) {
                    await dbQuery(
                        'INSERT INTO wo_parts (work_order_id, part_id, quantity_used) VALUES (?, ?, ?)',
                        [woId, part.part_id, part.quantity_used]
                    );
                    // Update inventory
                    await dbQuery('UPDATE parts SET quantity = quantity - ? WHERE id = ?', [part.quantity_used, part.part_id]);
                }
            }

            onSave();
        } catch (err) {
            console.error('Error saving work order:', err);
            alert('Failed to save work order: ' + err.message);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2>{initialData ? 'Edit Work Order' : 'Create Work Order'}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Asset</label>
                            <select name="asset_id" value={formData.asset_id} onChange={handleChange}>
                                <option value="">Select Asset</option>
                                {assets.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Type</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option value="repair">Repair</option>
                                <option value="pm">PM</option>
                                <option value="installation">Installation</option>
                            </select>
                        </div>
                        <div>
                            <label>Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div>
                            <label>Assigned To</label>
                            <select name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Due Date</label>
                            <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} />
                        </div>
                    </div>

                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="2"></textarea>

                    <label>Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea>

                    <label>Cost</label>
                    <input
                        type="number"
                        name="cost"
                        value={formData.cost}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    />

                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4>Parts Consumed</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <select value={newPartId} onChange={(e) => setNewPartId(e.target.value)} style={{ flex: 2, marginBottom: 0 }}>
                                <option value="">Select Part</option>
                                {parts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={newPartQty}
                                onChange={(e) => setNewPartQty(e.target.value)}
                                min="1"
                                style={{ flex: 1, marginBottom: 0 }}
                            />
                            <button type="button" className="btn btn-secondary" onClick={handleAddPart}>Add</button>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {consumedParts.map((p, i) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                                    <span>{p.name}</span>
                                    <span>x{p.quantity_used}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Work Order</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkOrderForm;
