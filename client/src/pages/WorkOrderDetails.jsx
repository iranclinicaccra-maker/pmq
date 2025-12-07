import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbQuery } from '../api';
import { ArrowLeft, Printer } from 'lucide-react';

const WorkOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wo, setWo] = useState(null);
    const [parts, setParts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const woResult = await dbQuery(`
                    SELECT w.*, a.name as asset_name, a.model, a.serial_number, a.location_id, l.name as location_name, u.full_name as assignee_name
                    FROM work_orders w
                    LEFT JOIN assets a ON w.asset_id = a.id
                    LEFT JOIN locations l ON a.location_id = l.id
                    LEFT JOIN users u ON w.assigned_to = u.id
                    WHERE w.id = ?
                `, [id]);

                if (woResult.length > 0) {
                    setWo(woResult[0]);
                }

                const partsResult = await dbQuery(`
                    SELECT wp.*, p.name, p.part_number, p.cost
                    FROM wo_parts wp
                    JOIN parts p ON wp.part_id = p.id
                    WHERE wp.work_order_id = ?
                `, [id]);
                setParts(partsResult);
            } catch (err) {
                console.error('Error fetching WO details:', err);
            }
        };
        fetchData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (!wo) return <div>Loading...</div>;

    return (
        <div className="print-container">
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} className="btn" style={{ marginRight: '1rem' }}>
                    <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back
                </button>
                <button onClick={handlePrint} className="btn btn-primary">
                    <Printer size={18} style={{ marginRight: '0.5rem' }} /> Print Work Order
                </button>
            </div>

            <div className="card" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Work Order #{wo.id}</h1>
                        <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>Created: {wo.created_at}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#374151' }}>{wo.type}</div>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: '#f3f4f6',
                            fontSize: '0.875rem',
                            marginTop: '0.5rem'
                        }}>
                            {wo.status.replace('_', ' ')}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Asset Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem' }}>
                            <div style={{ color: '#6b7280' }}>Name:</div>
                            <div style={{ fontWeight: '500' }}>{wo.asset_name}</div>
                            <div style={{ color: '#6b7280' }}>Model:</div>
                            <div>{wo.model}</div>
                            <div style={{ color: '#6b7280' }}>Serial No:</div>
                            <div>{wo.serial_number}</div>
                            <div style={{ color: '#6b7280' }}>Location:</div>
                            <div>{wo.location_name || 'N/A'}</div>
                        </div>
                    </div>
                    <div>
                        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Work Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem' }}>
                            <div style={{ color: '#6b7280' }}>Priority:</div>
                            <div style={{ textTransform: 'capitalize' }}>{wo.priority}</div>
                            <div style={{ color: '#6b7280' }}>Assigned To:</div>
                            <div>{wo.assignee_name || 'Unassigned'}</div>
                            <div style={{ color: '#6b7280' }}>Due Date:</div>
                            <div>{wo.due_date}</div>
                            <div style={{ color: '#6b7280' }}>Completed:</div>
                            <div>{wo.completed_date || '-'}</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Description</h3>
                    <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
                        {wo.description}
                    </p>
                </div>

                {parts.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Parts Used</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Part Name</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Part Number</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parts.map((part, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{part.name}</td>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{part.part_number}</td>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{part.quantity_used}</td>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>${part.cost * part.quantity_used}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div>
                    <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Technician Notes</h3>
                    <div style={{ minHeight: '100px', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                        {wo.notes || 'No notes added.'}
                    </div>
                </div>

                <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.5rem' }}>Technician Signature</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.5rem' }}>Supervisor Signature</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderDetails;
