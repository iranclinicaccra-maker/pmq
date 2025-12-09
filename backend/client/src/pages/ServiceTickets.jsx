import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { Plus, Search } from 'lucide-react';
import WorkOrderForm from '../components/WorkOrderForm';

const ServiceTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTickets = async () => {
        try {
            const result = await dbQuery(`
        SELECT w.*, a.name as asset_name, a.serial_number, a.image_url, u.full_name as assignee
        FROM work_orders w
        LEFT JOIN assets a ON w.asset_id = a.id
        LEFT JOIN users u ON w.assigned_to = u.id
        ORDER BY w.created_at DESC
      `);
            setTickets(result);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleCreate = () => {
        setEditingTicket({ type: 'repair', status: 'open', priority: 'medium' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service ticket?')) {
            try {
                // Delete from work_orders as service tickets are just work orders
                await dbQuery('DELETE FROM work_orders WHERE id = ?', [id]);
                fetchTickets();
            } catch (err) {
                console.error('Error deleting service ticket:', err);
                alert('Failed to delete service ticket: ' + err.message);
            }
        }
    };

    const handleEdit = (ticket) => {
        setEditingTicket(ticket);
        setShowModal(true);
    };

    // Filter tickets based on search query
    const filteredTickets = tickets.filter(ticket => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            (ticket.asset_name && ticket.asset_name.toLowerCase().includes(query)) ||
            (ticket.serial_number && ticket.serial_number.toLowerCase().includes(query)) ||
            (ticket.description && ticket.description.toLowerCase().includes(query)) ||
            (ticket.status && ticket.status.toLowerCase().includes(query)) ||
            (ticket.assignee && ticket.assignee.toLowerCase().includes(query)) ||
            (ticket.type && ticket.type.toLowerCase().includes(query))
        );
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Service Tickets</h1>
                <button className="btn btn-primary" onClick={handleCreate}>
                    <Plus size={18} /> Create New Ticket
                </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search tickets by equipment, description, status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {filteredTickets.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p>No service tickets found.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Image</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Equipment</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Reported On</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Description</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map(ticket => (
                                <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden',
                                            backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {ticket.image_url ? (
                                                <img
                                                    src={ticket.image_url.startsWith('data:') ? ticket.image_url : `file://${ticket.image_url}`}
                                                    alt={ticket.asset_name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>No Img</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '500' }}>{ticket.asset_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SN: {ticket.serial_number}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {ticket.description || 'No description'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            backgroundColor: ticket.status === 'open' ? '#fee2e2' : ticket.status === 'completed' ? '#dcfce7' : '#fef3c7',
                                            color: ticket.status === 'open' ? '#ef4444' : ticket.status === 'completed' ? '#166534' : '#d97706'
                                        }}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', marginRight: '0.5rem' }}
                                            onClick={() => handleEdit(ticket)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                            onClick={() => handleDelete(ticket.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <WorkOrderForm
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchTickets(); }}
                    initialData={editingTicket}
                />
            )}
        </div>
    );
};

export default ServiceTickets;
