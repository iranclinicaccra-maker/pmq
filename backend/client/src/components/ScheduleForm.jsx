import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';

const ScheduleForm = ({ onClose, onSave, initialData = null }) => {
    const [formData, setFormData] = useState(initialData || {
        equipment_id: '',
        pm_definition_id: '',
        frequency_type: 'time',
        frequency_value: 30,
        next_due: ''
    });

    const [equipmentList, setEquipmentList] = useState([]);
    const [pmList, setPmList] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eq = await dbQuery('SELECT id, name, serial_number FROM equipment');
                const pm = await dbQuery('SELECT id, title FROM pm_definitions');
                setEquipmentList(eq);
                setPmList(pm);
            } catch (err) {
                console.error('Error fetching dropdown data:', err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (initialData) {
                await dbQuery(
                    `UPDATE pm_schedules SET equipment_id = ?, pm_definition_id = ?, frequency_type = ?, frequency_value = ?, next_due = ? WHERE id = ?`,
                    [formData.equipment_id, formData.pm_definition_id, formData.frequency_type, formData.frequency_value, formData.next_due, initialData.id]
                );
            } else {
                await dbQuery(
                    `INSERT INTO pm_schedules (equipment_id, pm_definition_id, frequency_type, frequency_value, next_due) VALUES (?, ?, ?, ?, ?)`,
                    [formData.equipment_id, formData.pm_definition_id, formData.frequency_type, formData.frequency_value, formData.next_due]
                );
            }
            onSave();
            onClose();
        } catch (err) {
            console.error('Error saving schedule:', err);
            alert('خطا در ذخیره');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2>{initialData ? 'ویرایش زمان‌بندی' : 'افزودن زمان‌بندی جدید'}</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        دستگاه:
                        <select name="equipment_id" value={formData.equipment_id} onChange={handleChange} required>
                            <option value="">انتخاب کنید</option>
                            {equipmentList.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.serial_number})</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        تعریف PM:
                        <select name="pm_definition_id" value={formData.pm_definition_id} onChange={handleChange} required>
                            <option value="">انتخاب کنید</option>
                            {pmList.map(item => (
                                <option key={item.id} value={item.id}>{item.title}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        نوع تکرار:
                        <select name="frequency_type" value={formData.frequency_type} onChange={handleChange}>
                            <option value="time">زمانی (روز)</option>
                            <option value="usage">کارکرد (ساعت/تعداد)</option>
                        </select>
                    </label>
                    <label>
                        مقدار تکرار (روز/ساعت):
                        <input type="number" name="frequency_value" value={formData.frequency_value} onChange={handleChange} required />
                    </label>
                    <label>
                        تاریخ سررسید بعدی:
                        <input type="date" name="next_due" value={formData.next_due} onChange={handleChange} required />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" className="btn" onClick={onClose}>انصراف</button>
                        <button type="submit" className="btn btn-primary">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleForm;
