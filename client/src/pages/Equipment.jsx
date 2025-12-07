import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import EquipmentForm from '../components/EquipmentForm';
import EquipmentLabel from '../components/EquipmentLabel';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Plus, Eye, Upload, XCircle, Printer, ChevronLeft, ChevronRight, Search, Trash2, RefreshCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/activityLogger';

const Equipment = () => {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [filter, setFilter] = useState('');
    const [showLabel, setShowLabel] = useState(false);
    const [labelAsset, setLabelAsset] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);

    const location = useLocation();
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        console.log('[Equipment] URL params - status:', status);
        if (status) {
            setStatusFilter(status);
        } else {
            setStatusFilter('all');
        }
        setCurrentPage(1); // Reset to first page on filter change
    }, [location.search]);

    const fetchAssets = async () => {
        try {
            console.log('[Equipment] Fetching assets...');
            const result = await dbQuery(`
        SELECT a.*, l.name as location_name 
        FROM assets a 
        LEFT JOIN locations l ON a.location_id = l.id 
        ORDER BY a.created_at DESC
        LIMIT 500
      `);
            console.log('[Equipment] Assets fetched:', result ? result.length : 0);
            // Ensure result is an array before setting state
            if (Array.isArray(result)) {
                setAssets(result);
            } else {
                console.error('[Equipment] Expected array from dbQuery but got:', typeof result);
                setAssets([]);
            }
        } catch (err) {
            console.error('[Equipment] Error fetching assets:', err);
            setAssets([]); // Fallback to empty array on error
        }
    };

    const handleEdit = (asset) => {
        setEditingAsset(asset);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingAsset(null);
        setShowModal(true);
    };

    const handleExport = () => {
        const exportData = assets.map(asset => ({
            "ID": asset.id,
            "Name": asset.name,
            "Model": asset.model,
            "Serial Number": asset.serial_number,
            "Manufacturer": asset.manufacturer,
            "Location": asset.location_name || 'Unassigned',
            "Status": asset.status,
            "Purchase Date": asset.purchase_date,
            "Price": asset.price,
            "Warranty Expiry": asset.warranty_expiry,
            "Registration Number": asset.registration_number,
            "Last Calibration": asset.last_calibration_date,
            "Next Calibration": asset.next_calibration_date,
            "Vendor": asset.vendor_name,
            "Technician": asset.technician_name,
            "Notes": asset.notes
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Assets");
        XLSX.writeFile(wb, `equipment_inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDownloadTemplate = () => {
        // Create sample template data
        const templateData = [
            { name: 'Example Equipment 1', model: 'Model-001', serial_number: 'SN-12345', manufacturer: 'Example Manufacturer' },
            { name: 'Example Equipment 2', model: 'Model-002', serial_number: 'SN-67890', manufacturer: 'Example Manufacturer' }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "equipment_import_template.xlsx");
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    let importedCount = 0;
                    const importedItems = [];
                    for (const item of data) {
                        // Basic validation
                        if (item.name) {
                            await dbQuery(
                                `INSERT INTO assets (name, model, serial_number, manufacturer, status) VALUES (?, ?, ?, ?, 'active')`,
                                [item.name, item.model || '', item.serial_number || '', item.manufacturer || '']
                            );
                            importedCount++;
                            importedItems.push(item.name);
                        }
                    }

                    // Log the import operation
                    await logActivity(user, 'create', 'asset', null, `Bulk Import (${importedCount} items)`, {
                        imported: { count: importedCount, items: importedItems }
                    });

                    alert(`Successfully imported ${importedCount} assets.`);
                    fetchAssets();
                } catch (err) {
                    console.error('Import Error:', err);
                    alert('Failed to import file.');
                }
            };
            reader.readAsBinaryString(file);
        }
    };

    const generateDisposalCertificate = (asset) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text('CERTIFICATE OF DISPOSAL', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 40);
        doc.text(`Certificate #: DSP-${asset.id}-${Date.now().toString().slice(-6)}`, 14, 50);

        // Asset Details
        doc.setFontSize(14);
        doc.text('Asset Details', 14, 70);
        doc.line(14, 72, 196, 72);

        doc.setFontSize(12);
        doc.text(`Asset Name: ${asset.name}`, 14, 85);
        doc.text(`Model: ${asset.model}`, 14, 95);
        doc.text(`Serial Number: ${asset.serial_number}`, 14, 105);
        doc.text(`Manufacturer: ${asset.manufacturer || 'N/A'}`, 14, 115);
        doc.text(`Asset ID: ${asset.id}`, 14, 125);

        // Disposal Declaration
        doc.setFontSize(14);
        doc.text('Disposal Declaration', 14, 145);
        doc.line(14, 147, 196, 147);

        doc.setFontSize(12);
        const declaration = "This document certifies that the equipment listed above has been disposed of in accordance with all applicable environmental regulations and company policies. All sensitive data has been securely erased or destroyed.";
        const splitText = doc.splitTextToSize(declaration, 180);
        doc.text(splitText, 14, 160);

        // Signatures
        doc.text('Authorized Signature:', 14, 200);
        doc.line(60, 200, 120, 200); // Signature line

        doc.text('Date:', 130, 200);
        doc.line(145, 200, 190, 200); // Date line

        doc.text('Printed Name:', 14, 220);
        doc.line(60, 220, 120, 220);

        doc.save(`disposal_certificate_${asset.id}.pdf`);
    };

    const handleDispose = async (asset) => {
        if (window.confirm(`Are you sure you want to mark "${asset.name}" as DISPOSED? This action cannot be easily undone.`)) {
            try {
                await dbQuery("UPDATE assets SET status = 'disposed' WHERE id = ?", [asset.id]);
                await logActivity(user, 'update', 'asset', asset.id, asset.name, { status: 'disposed', previous_status: asset.status });
                fetchAssets();
                alert('Asset marked as disposed.');
            } catch (err) {
                console.error('Error disposing asset:', err);
                alert('Failed to dispose asset.');
            }
        }
    };

    // Filter Logic
    const filteredAssets = assets.filter(asset => {
        const searchLower = filter.toLowerCase();
        const matchesSearch = (asset.name || '').toLowerCase().includes(searchLower) ||
            (asset.model || '').toLowerCase().includes(searchLower) ||
            (asset.serial_number || '').toLowerCase().includes(searchLower) ||
            (asset.manufacturer || '').toLowerCase().includes(searchLower) ||
            (asset.location_name || '').toLowerCase().includes(searchLower);

        let matchesStatus = true;
        if (statusFilter === 'calibration_overdue' || statusFilter === 'overdue') {
            const today = new Date().toISOString().split('T')[0];
            // Check if asset has a calibration date and it's overdue
            if (asset.next_calibration_date) {
                matchesStatus = asset.next_calibration_date < today;
                console.log('[Equipment] Overdue check:', asset.name, 'next_cal:', asset.next_calibration_date, 'today:', today, 'overdue:', matchesStatus);
            } else {
                matchesStatus = false; // No calibration date = not overdue
            }
        } else if (statusFilter === 'retired') {
            // Show both 'retired' and 'broken' assets
            matchesStatus = asset.status === 'retired' || asset.status === 'broken';
        } else {
            matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
        }

        return matchesSearch && matchesStatus;
    });


    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    console.log('[Equipment] Rendering - assets:', assets.length, 'filtered:', filteredAssets.length, 'page:', currentPage);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Equipment Inventory</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" onClick={fetchAssets} title="Refresh List">
                        <RefreshCcw size={18} />
                    </button>
                    <button className="btn btn-outline" onClick={handleExport}>
                        <Download size={18} /> Export Excel
                    </button>
                    <button className="btn btn-primary" onClick={handleAddNew}>
                        <Plus size={18} /> Add Equipment
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                    position: 'relative',
                    maxWidth: '300px',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '0.75rem',
                            color: 'var(--text-secondary)',
                            pointerEvents: 'none'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search equipment..."
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                            paddingLeft: '2.5rem',
                            width: '100%'
                        }}
                    />
                </div >
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Operational</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="calibration_overdue">Calibration Overdue</option>
                    <option value="retired">Retired/Broken</option>
                    <option value="disposed">Disposed</option>
                </select>
            </div >

            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Model</th>
                                <th>SN</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Next Cal.</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((asset) => (
                                <tr key={asset.id}>
                                    <td>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden',
                                            backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {asset.image_url ? (
                                                <img
                                                    src={asset.image_url.startsWith('data:') ? asset.image_url : `file://${asset.image_url}`}
                                                    alt={asset.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>No Img</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{asset.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{asset.manufacturer}</div>
                                    </td>
                                    <td>{asset.model}</td>
                                    <td>{asset.serial_number}</td>
                                    <td>{asset.location_name || 'Unassigned'}</td>
                                    <td>
                                        <span className={`badge badge-${asset.status === 'active' ? 'success' : asset.status === 'maintenance' ? 'warning' : asset.status === 'disposed' ? 'secondary' : 'danger'}`}>
                                            {asset.status}
                                        </span>
                                    </td>
                                    <td>
                                        {asset.next_calibration_date && (
                                            <span style={{
                                                color: new Date(asset.next_calibration_date) < new Date() ? 'var(--danger-color)' : 'inherit',
                                                fontWeight: new Date(asset.next_calibration_date) < new Date() ? 'bold' : 'normal'
                                            }}>
                                                {asset.next_calibration_date}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <Link to={`/assets/${asset.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                                                <Eye size={14} />
                                            </Link>
                                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleEdit(asset)}>Edit</button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.5rem', color: '#ef4444', borderColor: '#ef4444' }}
                                                onClick={() => handleDelete(asset.id)}
                                                title="Delete Permanently"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Trash2 size={14} style={{ marginRight: '4px' }} />
                                                    <span>Delete</span>
                                                </div>
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.5rem', color: '#3b82f6', borderColor: '#3b82f6' }}
                                                onClick={() => { setLabelAsset(asset); setShowLabel(true); }}
                                                title="Print Label"
                                            >
                                                <Printer size={14} />
                                            </button>

                                            {asset.status === 'disposed' ? (
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.25rem 0.5rem', color: '#64748b', borderColor: '#64748b' }}
                                                    onClick={() => generateDisposalCertificate(asset)}
                                                    title="Print Disposal Certificate"
                                                >
                                                    <Download size={14} /> Cert
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.25rem 0.5rem', color: '#ef4444', borderColor: '#ef4444' }}
                                                    onClick={() => handleDispose(asset)}
                                                    title="Mark as Disposed"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentItems.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                        No assets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAssets.length)} of {filteredAssets.length} entries
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{ padding: '0.5rem' }}
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Logic to show window of pages around current page
                                    let pageNum = i + 1;
                                    if (totalPages > 5) {
                                        if (currentPage > 3) {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        if (pageNum > totalPages) {
                                            pageNum = totalPages - (4 - i);
                                        }
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => paginate(pageNum)}
                                            style={{ width: '32px', height: '32px', padding: 0 }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                className="btn btn-outline"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{ padding: '0.5rem' }}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {
                showModal && (
                    <EquipmentForm
                        onClose={() => setShowModal(false)}
                        onSave={() => { setShowModal(false); fetchAssets(); }}
                        initialData={editingAsset}
                    />
                )
            }

            {
                showLabel && (
                    <EquipmentLabel
                        asset={labelAsset}
                        onClose={() => { setShowLabel(false); setLabelAsset(null); }}
                    />
                )
            }
        </div >
    );
};

export default Equipment;
