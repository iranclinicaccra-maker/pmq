import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const EquipmentLabel = ({ asset, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    if (!asset) return null;

    // Create QR code data with all important asset info
    const qrData = JSON.stringify({
        id: asset.id,
        name: asset.name,
        serial: asset.serial_number,
        model: asset.model,
        location: asset.location_name
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '800px', padding: '2rem' }}
            >
                {/* Print Styles */}
                <style>
                    {`
                        @media print {
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            
                            body * {
                                visibility: hidden;
                            }
                            
                            .print-area, .print-area * {
                                visibility: visible !important;
                            }
                            
                            .print-area {
                                position: fixed !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 1cm !important;
                            }
                            
                            .no-print {
                                display: none !important;
                                visibility: hidden !important;
                            }
                            
                            .modal-overlay {
                                background: white !important;
                                position: static !important;
                            }
                            
                            @page {
                                size: A4;
                                margin: 1cm;
                            }
                        }
                    `}
                </style>

                {/* Header with buttons */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0 }}>Equipment Label</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary" onClick={handlePrint}>
                            🖨️ Print Label
                        </button>
                        <button className="btn btn-outline" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>

                {/* Printable Area */}
                <div className="print-area">
                    {/* Label Container */}
                    <div style={{
                        border: '3px solid #000',
                        padding: '2rem',
                        backgroundColor: '#fff',
                        fontFamily: 'Arial, sans-serif',
                        maxWidth: '700px',
                        margin: '0 auto'
                    }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '3px solid #000', paddingBottom: '1rem' }}>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#000' }}>Medical Equipment</h1>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', color: '#333' }}>Asset Identification Label</p>
                        </div>

                        {/* QR Code */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff' }}>
                            <div style={{ padding: '1rem', border: '2px solid #000', backgroundColor: '#fff' }}>
                                <QRCodeCanvas
                                    value={qrData}
                                    size={150}
                                    level="H"
                                    includeMargin={false}
                                    style={{ display: 'block' }}
                                />
                            </div>
                        </div>

                        {/* Serial Number below QR */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {asset.serial_number || `ID: ${asset.id}`}
                        </div>

                        {/* Equipment Information - Two Columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.95rem' }}>
                            {/* Left Column */}
                            <div>
                                <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Equipment Name</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#000' }}>{asset.name}</div>
                                </div>

                                <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Model</div>
                                    <div style={{ color: '#000' }}>{asset.model || 'N/A'}</div>
                                </div>

                                <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Serial Number</div>
                                    <div style={{ fontFamily: 'monospace', color: '#000' }}>{asset.serial_number || 'N/A'}</div>
                                </div>

                                <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Manufacturer</div>
                                    <div style={{ color: '#000' }}>{asset.manufacturer || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div>
                                <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Asset ID</div>
                                    <div style={{ fontFamily: 'monospace', color: '#000' }}>#{asset.id}</div>
                                </div>

                                <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Location</div>
                                    <div style={{ color: '#000' }}>{asset.location_name || 'Unassigned'}</div>
                                </div>

                                <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                                    <div style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#000' }}>{asset.status}</div>
                                </div>

                                {asset.registration_number && (
                                    <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Registration #</div>
                                        <div style={{ fontFamily: 'monospace', color: '#000' }}>{asset.registration_number}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Calibration Section (if applicable) */}
                        {(asset.last_calibration_date || asset.next_calibration_date) && (
                            <div style={{
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '2px solid #000',
                                backgroundColor: '#f8f9fa',
                                padding: '1rem',
                                borderRadius: '4px',
                                pageBreakInside: 'avoid'
                            }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#000' }}>Calibration Information</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                    {asset.last_calibration_date && (
                                        <div>
                                            <span style={{ color: '#555' }}>Last Calibrated:</span>
                                            <strong style={{ marginLeft: '0.5rem', color: '#000' }}>{asset.last_calibration_date}</strong>
                                        </div>
                                    )}
                                    {asset.next_calibration_date && (
                                        <div>
                                            <span style={{ color: '#555' }}>Next Calibration:</span>
                                            <strong style={{ marginLeft: '0.5rem', color: '#000' }}>{asset.next_calibration_date}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{
                            marginTop: '2rem',
                            paddingTop: '1rem',
                            borderTop: '3px solid #000',
                            fontSize: '0.8rem',
                            color: '#555',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <div><strong>Medical PM Manager</strong></div>
                            <div>Printed: {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EquipmentLabel;
