import React, { useState, useEffect } from 'react';
import { dbQuery, saveFile } from '../api';
import { useAuth } from '../context/AuthContext';
import { logActivity, getChanges } from '../utils/activityLogger';

const EquipmentForm = ({ onClose, onSave, initialData }) => {
    const { user } = useAuth();
    const [locations, setLocations] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        model: '',
        serial_number: '',
        registration_number: '',
        manufacturer: '',
        purchase_date: '',
        price: '',
        warranty_expiry: '',
        location_id: '',
        status: 'active',
        image_url: '',
        manual_path: '',
        notes: '',
        last_calibration_date: '',
        next_calibration_date: '',
        vendor_name: '',
        vendor_contact: '',
        vendor_phone: '',
        vendor_address: '',
        technician_name: '',
        technician_phone: '',
        technician_address: ''
    });

    useEffect(() => {
        const fetchLocations = async () => {
            const result = await dbQuery('SELECT * FROM locations ORDER BY name ASC');
            setLocations(result);
        };
        fetchLocations();

        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    // Build hierarchical tree structure for locations
    const buildLocationTree = (locations, parentId = null, indent = 0) => {
        const tree = [];
        const children = locations.filter(loc => loc.parent_id === parentId);

        children.forEach(child => {
            tree.push({
                ...child,
                indent: indent,
                displayName: '  '.repeat(indent) + (indent > 0 ? '└─ ' : '') + child.name
            });
            // Recursively add children
            tree.push(...buildLocationTree(locations, child.id, indent + 1));
        });

        return tree;
    };

    const locationTree = buildLocationTree(locations);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e, field) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Read file as Data URL for preview and storage
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const dataUrl = evt.target.result;
                    setFormData(prev => ({ ...prev, [field]: dataUrl }));
                };
                reader.readAsDataURL(file);
            } catch (err) {
                console.error('File upload failed:', err);
                alert('Failed to upload file.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Helper to convert empty strings to null for PostgreSQL
            const sanitize = (val) => (val === '' ? null : val);

            const locationId = sanitize(formData.location_id);
            const price = sanitize(formData.price);

            if (initialData) {
                // Update existing asset
                await dbQuery(
                    `UPDATE assets SET 
                    name=?, model=?, serial_number=?, registration_number=?, manufacturer=?, purchase_date=?, 
                    price=?, warranty_expiry=?, location_id=?, status=?, image_url=?, manual_path=?, notes=?,
                    last_calibration_date=?, next_calibration_date=?, 
                    vendor_name=?, vendor_contact=?, vendor_phone=?, vendor_address=?,
                    technician_name=?, technician_phone=?, technician_address=?
                    WHERE id=?`,
                    [
                        sanitize(formData.name), sanitize(formData.model), sanitize(formData.serial_number), sanitize(formData.registration_number), sanitize(formData.manufacturer),
                        sanitize(formData.purchase_date), price, sanitize(formData.warranty_expiry),
                        locationId, sanitize(formData.status), sanitize(formData.image_url), sanitize(formData.manual_path), sanitize(formData.notes),
                        sanitize(formData.last_calibration_date), sanitize(formData.next_calibration_date),
                        sanitize(formData.vendor_name), sanitize(formData.vendor_contact), sanitize(formData.vendor_phone), sanitize(formData.vendor_address),
                        sanitize(formData.technician_name), sanitize(formData.technician_phone), sanitize(formData.technician_address),
                        initialData.id
                    ]
                );

                // Log the update
                const changes = getChanges(initialData, formData);
                await logActivity(user, 'update', 'asset', initialData.id, formData.name, changes);
            } else {
                // Create new asset
                // Added RETURNING id for PostgreSQL
                const result = await dbQuery(
                    `INSERT INTO assets (
                        name, model, serial_number, registration_number, manufacturer, purchase_date, 
                        price, warranty_expiry, location_id, status, image_url, manual_path, notes,
                        last_calibration_date, next_calibration_date, 
                        vendor_name, vendor_contact, vendor_phone, vendor_address,
                        technician_name, technician_phone, technician_address
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                    [
                        sanitize(formData.name), sanitize(formData.model), sanitize(formData.serial_number), sanitize(formData.registration_number), sanitize(formData.manufacturer),
                        sanitize(formData.purchase_date), price, sanitize(formData.warranty_expiry),
                        locationId, sanitize(formData.status), sanitize(formData.image_url), sanitize(formData.manual_path), sanitize(formData.notes),
                        sanitize(formData.last_calibration_date), sanitize(formData.next_calibration_date),
                        sanitize(formData.vendor_name), sanitize(formData.vendor_contact), sanitize(formData.vendor_phone), sanitize(formData.vendor_address),
                        sanitize(formData.technician_name), sanitize(formData.technician_phone), sanitize(formData.technician_address)
                    ]
                );

                // Log the creation
                // result is an array of rows in the web version
                const newId = result[0]?.id;
                if (newId) {
                    await logActivity(user, 'create', 'asset', newId, formData.name, { created: formData });
                }
            }
            onSave();
        } catch (err) {
            console.error('Error saving asset:', err);
            alert('Failed to save asset: ' + err.message);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2>{initialData ? 'Edit Asset' : 'Add New Asset'}</h2>
                <form onSubmit={handleSubmit}>

                    {/* General Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label>Name *</label>
                            <input name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Model</label>
                            <input name="model" value={formData.model} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Serial Number</label>
                            <input name="serial_number" value={formData.serial_number} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Registration Number</label>
                            <input name="registration_number" value={formData.registration_number} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label>Device Image</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '100px', height: '100px',
                                backgroundColor: '#f3f4f6', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px dashed #d1d5db', color: '#9ca3af'
                            }}>
                                {formData.image_url ? <img src={formData.image_url.startsWith('data:') ? formData.image_url : `file://${formData.image_url}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : 'No Image'}
                            </div>
                            <label className="btn btn-outline" style={{ cursor: 'pointer', margin: 0 }}>
                                Upload Image
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'image_url')} />
                            </label>
                        </div>
                    </div>

                    {/* Location & Status */}
                    <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Location & Status</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label>Physical Location</label>
                            <select name="location_id" value={formData.location_id} onChange={handleChange}>
                                <option value="">Select a location</option>
                                {locationTree.map(loc => (
                                    <option key={loc.id} value={loc.id} style={{ fontFamily: 'monospace' }}>
                                        {loc.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Working Status</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="active">Operational</option>
                                <option value="inactive">Inactive</option>
                                <option value="maintenance">Under Maintenance</option>
                                <option value="retired">Retired/Broken</option>
                                <option value="disposed">Disposed</option>
                            </select>
                        </div>
                    </div>

                    {/* Calibration Details */}
                    <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Calibration Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label>Last Calibration Date</label>
                            <input type="date" name="last_calibration_date" value={formData.last_calibration_date} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Next Calibration Date</label>
                            <input type="date" name="next_calibration_date" value={formData.next_calibration_date} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Vendor Information */}
                    <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Vendor Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label>Vendor Name</label>
                            <input name="vendor_name" value={formData.vendor_name} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Vendor Contact</label>
                            <input name="vendor_contact" value={formData.vendor_contact} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Vendor Phone</label>
                            <input name="vendor_phone" value={formData.vendor_phone} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Vendor Address</label>
                            <input name="vendor_address" value={formData.vendor_address} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Manufacturer</label>
                            <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Purchase Date</label>
                            <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Price</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Warranty Expiry</label>
                            <input type="date" name="warranty_expiry" value={formData.warranty_expiry} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Technician Information */}
                    <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Technician Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label>Technician Name</label>
                            <input name="technician_name" value={formData.technician_name} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Technician Phone</label>
                            <input name="technician_phone" value={formData.technician_phone} onChange={handleChange} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label>Technician Address</label>
                            <input name="technician_address" value={formData.technician_address} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Other */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label>Manual (PDF)</label>
                        <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'manual_path')} />
                        {formData.manual_path && <div style={{ fontSize: '0.8rem', color: 'green' }}>Manual uploaded</div>}
                    </div>

                    <label>Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"></textarea>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Asset</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentForm;
