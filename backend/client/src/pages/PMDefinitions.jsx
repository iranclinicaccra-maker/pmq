import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import PMDefinitionForm from '../components/PMDefinitionForm';

const PMDefinitions = () => {
    const [pmList, setPmList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchPMs = async () => {
        setLoading(true);
        try {
            const result = await dbQuery('SELECT * FROM pm_definitions ORDER BY created_at DESC');
            setPmList(result);
        } catch (err) {
            console.error('Failed to fetch PMs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPMs();
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
        if (window.confirm('آیا از حذف این تعریف PM مطمئن هستید؟')) {
            try {
                await dbQuery('DELETE FROM pm_definitions WHERE id = ?', [id]);
                fetchPMs();
            } catch (err) {
                console.error('Error deleting PM definition:', err);
                alert('خطا در حذف');
            }
        }
    };

    const handleSave = () => {
        fetchPMs();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1>تعاریف PM (چک‌لیست‌ها)</h1>
                <button className="btn btn-primary" onClick={handleAdd}>
                    افزودن چک‌لیست جدید
                </button>
            </div>

            {loading ? (
                <p>در حال بارگذاری...</p>
            ) : (
                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>
                                <th style={{ padding: '0.5rem' }}>عنوان</th>
                                <th style={{ padding: '0.5rem' }}>توضیحات</th>
                                <th style={{ padding: '0.5rem' }}>تعداد آیتم چک‌لیست</th>
                                <th style={{ padding: '0.5rem' }}>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pmList.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>هیچ چک‌لیستی تعریف نشده است.</td>
                                </tr>
                            ) : (
                                pmList.map((item) => {
                                    let checklistCount = 0;
                                    try {
                                        checklistCount = JSON.parse(item.checklist || '[]').length;
                                    } catch (e) { }

                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.5rem' }}>{item.title}</td>
                                            <td style={{ padding: '0.5rem' }}>{item.description}</td>
                                            <td style={{ padding: '0.5rem' }}>{checklistCount}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <button className="btn" style={{ marginRight: '0.5rem', fontSize: '0.8rem' }} onClick={() => handleEdit(item)}>ویرایش</button>
                                                <button className="btn" style={{ color: 'red', fontSize: '0.8rem' }} onClick={() => handleDelete(item.id)}>حذف</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <PMDefinitionForm
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    initialData={editingItem}
                />
            )}
        </div>
    );
};

export default PMDefinitions;
