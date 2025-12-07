import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { useAuth } from '../context/AuthContext';
import { logActivity, getChanges } from '../utils/activityLogger';

const PartForm = ({ onClose, onSave, initialData }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        part_number: '',
        quantity: 0,
        min_quantity: 0,
        cost: 0,
        description: '',
        image_url: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (initialData) {
                await dbQuery(
                    `UPDATE parts SET 
            name=?, part_number=?, quantity=?, min_quantity=?, cost=?, description=?, image_url=?
           WHERE id=?`,
                    [
                        formData.name, formData.part_number, formData.quantity,
                        formData.min_quantity, formData.cost, formData.description,
                        formData.image_url, initialData.id
                    ]
                );

                // Log the update
                const changes = getChanges(initialData, formData);
                await logActivity(user, 'update', 'part', initialData.id, formData.name, changes);
            } else {
                const result = await dbQuery(
                    `INSERT INTO parts (
            name, part_number, quantity, min_quantity, cost, description, image_url
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        formData.name, formData.part_number, formData.quantity,
                        formData.min_quantity, formData.cost, formData.description,
                        formData.image_url
                    ]
                );

                // Log the creation
                await logActivity(user, 'create', 'part', result.lastInsertRowid, formData.name, { created: formData });
            }
            onSave();
        } catch (err) {
            console.error('Error saving part:', err);
            alert('Failed to save part.');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2>{initialData ? 'Edit Part' : 'Add New Part'}</h2>
                <form onSubmit={handleSubmit}>
                    <label>Name *</label>
                    <input name="name" value={formData.name} onChange={handleChange} required />

                    {/* Image Upload */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Part Image</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '80px', height: '80px',
                                backgroundColor: '#f3f4f6', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px dashed #d1d5db', color: '#9ca3af', overflow: 'hidden'
                            }}>
                                {formData.image_url ? (
                                    <img
                                        src={formData.image_url.startsWith('data:') ? formData.image_url : `file://${formData.image_url}`}
                                        alt="Preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : 'No Image'}
                            </div>
                            <label className="btn btn-outline" style={{ cursor: 'pointer', margin: 0 }}>
                                Upload Image
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'image_url')} />
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Part Number</label>
                            <input name="part_number" value={formData.part_number} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Cost ($)</label>
                            <input type="number" name="cost" value={formData.cost} onChange={handleChange} step="0.01" />
                        </div>
                        <div>
                            <label>Quantity</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Min Quantity</label>
                            <input type="number" name="min_quantity" value={formData.min_quantity} onChange={handleChange} />
                        </div>
                    </div>

                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3"></textarea>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Part</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PartForm;
