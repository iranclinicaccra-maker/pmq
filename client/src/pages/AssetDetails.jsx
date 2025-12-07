import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbQuery, openFile, getUploadPath } from '../api';
import EquipmentLabel from '../components/EquipmentLabel';
import { ArrowLeft, FileText, Wrench, Calendar, Clock, AlertCircle, Printer } from 'lucide-react';

const AssetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [history, setHistory] = useState([]);
    const [uploadPath, setUploadPath] = useState('');
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const assetResult = await dbQuery(`
                    SELECT a.*, l.name as location_name 
                    FROM assets a 
                    LEFT JOIN locations l ON a.location_id = l.id 
                    WHERE a.id = ?`, [id]);

                if (assetResult.length > 0) {
                    setAsset(assetResult[0]);
                }

                const historyResult = await dbQuery(`
                    SELECT w.*, u.full_name as assignee
                    FROM work_orders w
                    LEFT JOIN users u ON w.assigned_to = u.id
                    WHERE w.asset_id = ?
                    ORDER BY w.created_at DESC
                `, [id]);
                setHistory(historyResult);

                const path = await getUploadPath();
                setUploadPath(path);
            } catch (err) {
                console.error('Error fetching asset details:', err);
            }
        };
        fetchData();
    }, [id]);

    const handleOpenManual = async () => {
        if (asset?.manual_path) {
            await openFile(asset.manual_path);
        }
    };

    if (!asset) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn" style={{ paddingLeft: 0 }}>
                    <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to List
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowLabel(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Printer size={18} /> Print Label
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h1 style={{ margin: '0 0 0.5rem 0' }}>{asset.name}</h1>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    SN: {asset.serial_number} | Model: {asset.model}
                                </p>
                            </div>
                            <span className={`status-badge status-${asset.status}`}>
                                {asset.status}
                            </span>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Registration Number</label>
                                <div>{asset.registration_number || 'N/A'}</div>
                            </div>
                            <div>
                                <label>Manufacturer</label>
                                <div>{asset.manufacturer}</div>
                            </div>
                            <div>
                                <label>Location</label>
                                <div>{asset.location_name || 'N/A'}</div>
                            </div>
                            <div>
                                <label>Purchase Date</label>
                                <div>{asset.purchase_date}</div>
                            </div>
                            <div>
                                <label>Warranty Expiry</label>
                                <div>{asset.warranty_expiry}</div>
                            </div>
                            <div>
                                <label>Vendor</label>
                                <div>{asset.vendor_name || 'N/A'}</div>
                                {asset.vendor_contact && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contact: {asset.vendor_contact}</div>}
                                {asset.vendor_phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone: {asset.vendor_phone}</div>}
                                {asset.vendor_address && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Addr: {asset.vendor_address}</div>}
                            </div>
                            <div>
                                <label>Technician</label>
                                <div>{asset.technician_name || 'N/A'}</div>
                                {asset.technician_phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone: {asset.technician_phone}</div>}
                                {asset.technician_address && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Addr: {asset.technician_address}</div>}
                            </div>
                            <div>
                                <label>Last Calibration</label>
                                <div>{asset.last_calibration_date || 'N/A'}</div>
                            </div>
                            <div>
                                <label>Next Calibration</label>
                                <div style={{ color: asset.next_calibration_date ? 'var(--primary-color)' : 'inherit', fontWeight: '500' }}>
                                    {asset.next_calibration_date || 'N/A'}
                                </div>
                            </div>
                        </div>

                        {asset.manual_path && (
                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <button className="btn btn-primary" onClick={handleOpenManual}>
                                    <FileText size={18} /> Open Manual
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <Wrench size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Maintenance History</h2>
                        </div>

                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Assigned To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(wo => (
                                    <tr key={wo.id}>
                                        <td>#{wo.id}</td>
                                        <td>{wo.type}</td>
                                        <td>{wo.created_at.split(' ')[0]}</td>
                                        <td>
                                            <span className={`status-badge status-${wo.status}`}>
                                                {wo.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{wo.assignee || 'Unassigned'}</td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                            No maintenance history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>Asset Image</h3>
                        {asset.image_url ? (
                            <img
                                src={asset.image_url.startsWith('data:') ? asset.image_url : `file://${uploadPath}/${asset.image_url}`}
                                alt={asset.name}
                                style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '200px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af'
                            }}>
                                No Image Available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showLabel && (
                <EquipmentLabel
                    asset={asset}
                    onClose={() => setShowLabel(false)}
                />
            )}
        </div>
    );
};

export default AssetDetails;
