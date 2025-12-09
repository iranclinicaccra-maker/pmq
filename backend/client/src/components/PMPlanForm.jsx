import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { useAuth } from '../context/AuthContext';
import { logActivity, getChanges } from '../utils/activityLogger';

const PMPlanForm = ({ onClose, onSave, initialData }) => {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [formData, setFormData] = useState({
        asset_id: '',
        title: '',
        frequency_days: 30,
        checklist: [],
        next_due_date: ''
    });
    const [checklistItem, setChecklistItem] = useState('');

    useEffect(() => {
        const fetchAssets = async () => {
            const result = await dbQuery('SELECT id, name FROM assets ORDER BY name ASC');
            setAssets(result);
        };
        fetchAssets();
    }, []);

    useEffect(() => {
        if (initialData) {
            let parsedChecklist = [];
            try {
                parsedChecklist = initialData.checklist ?
                    (typeof initialData.checklist === 'string' ? JSON.parse(initialData.checklist) : initialData.checklist)
                    : [];
            } catch (e) {
                console.error("Failed to parse checklist", e);
                parsedChecklist = [];
            }

            setFormData({
                asset_id: initialData.asset_id || '',
                title: initialData.title || '',
                frequency_days: initialData.frequency_days || 30,
                checklist: parsedChecklist,
                next_due_date: initialData.next_due_date || ''
            });
        } else {
            setFormData({
                asset_id: '',
                title: '',
                frequency_days: 30,
                checklist: [],
                next_due_date: ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addChecklistItem = () => {
        if (checklistItem.trim()) {
            setFormData(prev => ({
                ...prev,
                checklist: [...prev.checklist, { label: checklistItem, type: 'pass_fail' }]
            }));
            setChecklistItem('');
        }
    };

    const removeChecklistItem = (index) => {
        setFormData(prev => ({
            ...prev,
            checklist: prev.checklist.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const checklistJson = JSON.stringify(formData.checklist);

            if (initialData) {
                await dbQuery(
                    `UPDATE pm_plans SET 
            asset_id=?, title=?, frequency_days=?, checklist=?, next_due_date=?
           WHERE id=?`,
                    [
                        formData.asset_id, formData.title, formData.frequency_days,
                        checklistJson, formData.next_due_date, initialData.id
                    ]
                );

                // Log the update
                const changes = getChanges(initialData, { ...formData, checklist: checklistJson });
                await logActivity(user, 'update', 'pm_plan', initialData.id, formData.title, changes);
            } else {
                const result = await dbQuery(
                    `INSERT INTO pm_plans (
            asset_id, title, frequency_days, checklist, next_due_date
           ) VALUES (?, ?, ?, ?, ?)`,
                    [
                        formData.asset_id, formData.title, formData.frequency_days,
                        checklistJson, formData.next_due_date
                    ]
                );

                // Log the creation
                await logActivity(user, 'create', 'pm_plan', result.lastInsertRowid, formData.title, { created: formData });
            }
            onSave();
        } catch (err) {
            console.error('Error saving PM plan:', err);
            alert('Failed to save PM plan.');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2>{initialData ? 'Edit PM Plan' : 'Create PM Plan'}</h2>
                <form onSubmit={handleSubmit}>
                    <label>Asset *</label>
                    <select name="asset_id" value={formData.asset_id} onChange={handleChange} required>
                        <option value="">Select Asset</option>
                        {assets.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>

                    <label>Title *</label>
                    <input name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Monthly Inspection" />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Frequency (Days)</label>
                            <input type="number" name="frequency_days" value={formData.frequency_days} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Next Due Date</label>
                            <input type="date" name="next_due_date" value={formData.next_due_date} onChange={handleChange} required />
                        </div>
                    </div>

                    <label>Checklist Items</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            value={checklistItem}
                            onChange={(e) => setChecklistItem(e.target.value)}
                            placeholder="Add item..."
                            style={{ marginBottom: 0 }}
                        />
                        <button type="button" className="btn btn-secondary" onClick={addChecklistItem}>Add</button>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
                        {formData.checklist.map((item, index) => (
                            <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span>{item.label}</span>
                                <button type="button" style={{ color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => removeChecklistItem(index)}>x</button>
                            </li>
                        ))}
                    </ul>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Plan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PMPlanForm;
