import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { dbQuery } from '../api';
import WorkOrderForm from '../components/WorkOrderForm';
import { useAuth } from '../context/AuthContext';

const WorkOrders = () => {
    const [workOrders, setWorkOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingWO, setEditingWO] = useState(null);
    const [filter, setFilter] = useState('open'); // open, in_progress, closed, all, my_work
    const location = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const statusParam = params.get('status');
        if (statusParam) {
            setFilter(statusParam);
        }
    }, [location.search]);

    const fetchWorkOrders = async () => {
        try {
            let query = `
        SELECT w.*, a.name as asset_name, a.image_url, u.full_name as assignee_name
        FROM work_orders w
        LEFT JOIN assets a ON w.asset_id = a.id
        LEFT JOIN users u ON w.assigned_to = u.id
      `;

            if (filter !== 'all') {
                if (filter === 'open') {
                    query += " WHERE w.status IN ('open', 'in_progress', 'on_hold')";
                } else if (filter === 'overdue') {
                    const today = new Date().toISOString().split('T')[0];
                    query += ` WHERE w.status != 'closed' AND w.due_date < '${today}'`;
                } else if (filter === 'my_work') {
                    if (user) {
                        query += ` WHERE w.assigned_to = ${user.id} AND w.status != 'closed'`;
                    } else {
                        // If no user logged in (shouldn't happen in protected route), show nothing or all? 
                        // Let's show nothing to be safe
                        query += ` WHERE 1=0`;
                    }
                } else {
                    query += ` WHERE w.status = '${filter}'`;
                }
            }

            query += " ORDER BY w.due_date ASC";

            const result = await dbQuery(query);
            setWorkOrders(result);
        } catch (err) {
            console.error('Error fetching work orders:', err);
        }
    };

    useEffect(() => {
        fetchWorkOrders();
    }, [filter, user]); // Add user to dependency

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this work order?')) {
            try {
                await dbQuery('DELETE FROM work_orders WHERE id = ?', [id]);
                fetchWorkOrders();
            } catch (err) {
                console.error('Error deleting work order:', err);
                alert('Failed to delete work order');
            }
        }
    };

    const handleEdit = (wo) => {
        setEditingWO(wo);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingWO(null);
        setShowModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return '#3b82f6';
            case 'in_progress': return '#eab308';
            case 'completed': return '#22c55e';
            case 'closed': return '#64748b';
            case 'on_hold': return '#f97316';
            default: return '#64748b';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#eab308';
            case 'low': return '#3b82f6';
            default: return '#64748b';
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Work Orders</h1>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    + Create Work Order
                </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <button className={`btn ${filter === 'open' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('open')} style={{ marginRight: '0.5rem' }}>Active</button>
                <button className={`btn ${filter === 'my_work' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('my_work')} style={{ marginRight: '0.5rem' }}>My Work</button>
                <button className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('completed')} style={{ marginRight: '0.5rem' }}>Completed</button>
                <button className={`btn ${filter === 'closed' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('closed')} style={{ marginRight: '0.5rem' }}>Closed</button>
                <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All</button>
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Image</th>
                            <th>Asset</th>
                            <th>Type</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workOrders.map((wo) => (
                            <tr key={wo.id}>
                                <td>#{wo.id}</td>
                                <td>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden',
                                        backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {wo.image_url ? (
                                            <img
                                                src={wo.image_url.startsWith('data:') ? wo.image_url : `file://${wo.image_url}`}
                                                alt={wo.asset_name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>No Img</span>
                                        )}
                                    </div>
                                </td>
                                <td>{wo.asset_name || 'N/A'}</td>
                                <td style={{ textTransform: 'capitalize' }}>{wo.type}</td>
                                <td>
                                    <span style={{ color: getPriorityColor(wo.priority), fontWeight: 'bold', textTransform: 'capitalize' }}>
                                        {wo.priority}
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        backgroundColor: getStatusColor(wo.status) + '20',
                                        color: getStatusColor(wo.status),
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem',
                                        textTransform: 'capitalize'
                                    }}>
                                        {wo.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>{wo.assignee_name || 'Unassigned'}</td>
                                <td>{wo.due_date}</td>
                                <td>
                                    <Link to={`/work-orders/${wo.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem', textDecoration: 'none', display: 'inline-block' }}>Print</Link>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => handleEdit(wo)}>Edit</button>
                                    <button
                                        className="btn btn-danger"
                                        style={{ padding: '0.25rem 0.5rem' }}
                                        onClick={() => handleDelete(wo.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <WorkOrderForm
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchWorkOrders(); }}
                    initialData={editingWO}
                />
            )}
        </div>
    );
};

export default WorkOrders;
