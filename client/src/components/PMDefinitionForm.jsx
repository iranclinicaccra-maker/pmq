import React, { useState } from 'react';
import { dbQuery } from '../api';

const PMDefinitionForm = ({ onClose, onSave, initialData = null }) => {
    const [formData, setFormData] = useState(initialData ? {
        ...initialData,
        checklist: initialData.checklist ? JSON.parse(initialData.checklist) : []
    } : {
        title: '',
        description: '',
        checklist: []
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addChecklistItem = () => {
        setFormData(prev => ({
            ...prev,
            checklist: [...prev.checklist, { label: '', type: 'pass_fail' }]
        }));
    };

    const updateChecklistItem = (index, field, value) => {
        const newChecklist = [...formData.checklist];
        newChecklist[index] = { ...newChecklist[index], [field]: value };
        setFormData(prev => ({ ...prev, checklist: newChecklist }));
    };

    const removeChecklistItem = (index) => {
        const newChecklist = formData.checklist.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, checklist: newChecklist }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const checklistJson = JSON.stringify(formData.checklist);

            if (initialData) {
                await dbQuery(
                    `UPDATE pm_definitions SET title = ?, description = ?, checklist = ? WHERE id = ?`,
                    [formData.title, formData.description, checklistJson, initialData.id]
                );
            } else {
                await dbQuery(
                    `INSERT INTO pm_definitions (title, description, checklist) VALUES (?, ?, ?)`,
                    [formData.title, formData.description, checklistJson]
                );
            }
            onSave();
            onClose();
        } catch (err) {
            console.error('Error saving PM definition:', err);
            alert('خطا در ذخیره');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2>{initialData ? 'ویرایش چک‌لیست' : 'افزودن چک‌لیست جدید'}</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        عنوان:
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                    </label>
                    <label>
                        توضیحات:
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="2" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}></textarea>
                    </label>

                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>آیتم‌های چک‌لیست</h3>
                            <button type="button" className="btn" onClick={addChecklistItem} style={{ fontSize: '0.8rem' }}>+ افزودن آیتم</button>
                        </div>

                        {formData.checklist.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="عنوان آیتم (مثلا: بررسی کابل برق)"
                                    value={item.label}
                                    onChange={(e) => updateChecklistItem(index, 'label', e.target.value)}
                                    required
                                    style={{ marginBottom: 0, flex: 2 }}
                                />
                                <select
                                    value={item.type}
                                    onChange={(e) => updateChecklistItem(index, 'type', e.target.value)}
                                    style={{ marginBottom: 0, flex: 1 }}
                                >
                                    <option value="pass_fail">تایید/رد</option>
                                    <option value="numeric">عددی</option>
                                    <option value="text">متنی</option>
                                </select>
                                <button type="button" className="btn" style={{ color: 'red', padding: '0.25rem 0.5rem' }} onClick={() => removeChecklistItem(index)}>X</button>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" className="btn" onClick={onClose}>انصراف</button>
                        <button type="submit" className="btn btn-primary">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PMDefinitionForm;
