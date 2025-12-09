import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import ScheduleForm from '../components/ScheduleForm';

const Schedules = () => {
    const [scheduleList, setScheduleList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const result = await dbQuery(`
        SELECT s.*, e.name as equipment_name, p.title as pm_title 
        FROM pm_schedules s
        JOIN equipment e ON s.equipment_id = e.id
        JOIN pm_definitions p ON s.pm_definition_id = p.id
      `);
            setScheduleList(result);
        } catch (err) {
            console.error('Failed to fetch schedules:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('آیا از حذف این زمان‌بندی مطمئن هستید؟')) {
            try {
                await dbQuery('DELETE FROM pm_schedules WHERE id = ?', [id]);
                fetchSchedules();
            } catch (err) {
                console.error('Error deleting schedule:', err);
                alert('خطا در حذف');
            }
        }
    };

    const handleSave = () => {
        fetchSchedules();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1>زمان‌بندی PM</h1>
                <button className="btn btn-primary" onClick={handleAdd}>
                    افزودن زمان‌بندی جدید
                </button>
            </div>

            {loading ? (
                <p>در حال بارگذاری...</p>
            ) : (
                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>
                                <th style={{ padding: '0.5rem' }}>دستگاه</th>
                                <th style={{ padding: '0.5rem' }}>عنوان PM</th>
                                <th style={{ padding: '0.5rem' }}>نوع تکرار</th>
                                <th style={{ padding: '0.5rem' }}>مقدار تکرار</th>
                                <th style={{ padding: '0.5rem' }}>موعد بعدی</th>
                                <th style={{ padding: '0.5rem' }}>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scheduleList.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>هیچ زمان‌بندی تعریف نشده است.</td>
                                </tr>
                            ) : (
                                scheduleList.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.5rem' }}>{item.equipment_name}</td>
                                        <td style={{ padding: '0.5rem' }}>{item.pm_title}</td>
                                        <td style={{ padding: '0.5rem' }}>{item.frequency_type === 'time' ? 'زمانی (روز)' : 'کارکرد (ساعت/تعداد)'}</td>
                                        <td style={{ padding: '0.5rem' }}>{item.frequency_value}</td>
                                        <td style={{ padding: '0.5rem' }}>{item.next_due || '-'}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <button className="btn" style={{ marginRight: '0.5rem', fontSize: '0.8rem' }} onClick={() => handleEdit(item)}>ویرایش</button>
                                            <button className="btn" style={{ color: 'red', fontSize: '0.8rem' }} onClick={() => handleDelete(item.id)}>حذف</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <ScheduleForm
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    initialData={editingItem}
                />
            )}
        </div>
    );
};

export default Schedules;
