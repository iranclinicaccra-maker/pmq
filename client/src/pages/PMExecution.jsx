import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbQuery } from '../api';

const PMExecution = () => {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState(null);
    const [checklist, setChecklist] = useState([]);
    const [results, setResults] = useState({});
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sched = await dbQuery(`
          SELECT s.*, e.name as equipment_name, p.title as pm_title, p.checklist
          FROM pm_schedules s
          JOIN equipment e ON s.equipment_id = e.id
          JOIN pm_definitions p ON s.pm_definition_id = p.id
          WHERE s.id = ?
        `, [scheduleId]);

                if (sched.length > 0) {
                    setSchedule(sched[0]);
                    const parsedChecklist = JSON.parse(sched[0].checklist || '[]');
                    setChecklist(parsedChecklist);

                    // Initialize results
                    const initialResults = {};
                    parsedChecklist.forEach((item, index) => {
                        initialResults[index] = {
                            status: 'pass',
                            value: '',
                            notes: ''
                        };
                    });
                    setResults(initialResults);
                }
            } catch (err) {
                console.error('Error fetching schedule:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [scheduleId]);

    const handleResultChange = (index, field, value) => {
        setResults(prev => ({
            ...prev,
            [index]: { ...prev[index], [field]: value }
        }));
    };

    const handleSubmit = async () => {
        try {
            // 1. Create Maintenance Log
            const logResult = await dbQuery(
                `INSERT INTO maintenance_logs (equipment_id, pm_schedule_id, technician, status, notes) VALUES (?, ?, ?, ?, ?)`,
                [schedule.equipment_id, schedule.id, 'Current User', 'pass', notes]
            );
            const logId = logResult.lastInsertRowid;

            // 2. Save Checklist Results
            for (let i = 0; i < checklist.length; i++) {
                const item = checklist[i];
                const res = results[i];
                await dbQuery(
                    `INSERT INTO checklist_results (maintenance_log_id, item_label, status, value, notes) VALUES (?, ?, ?, ?, ?)`,
                    [logId, item.label, res.status, res.value, res.notes]
                );
            }

            // 3. Update Schedule (Next Due)
            // Simple logic: add frequency to today
            const today = new Date();
            const nextDue = new Date(today);
            if (schedule.frequency_type === 'time') {
                nextDue.setDate(today.getDate() + parseInt(schedule.frequency_value));
            }
            // For usage based, we might need manual input for next due or just leave it

            await dbQuery(
                `UPDATE pm_schedules SET last_performed = ?, next_due = ? WHERE id = ?`,
                [today.toISOString().split('T')[0], nextDue.toISOString().split('T')[0], schedule.id]
            );

            alert('PM با موفقیت ثبت شد');
            navigate('/');
        } catch (err) {
            console.error('Error saving PM execution:', err);
            alert('خطا در ثبت اطلاعات');
        }
    };

    if (loading) return <p>در حال بارگذاری...</p>;
    if (!schedule) return <p>برنامه یافت نشد.</p>;

    return (
        <div>
            <h1>اجرای PM: {schedule.pm_title}</h1>
            <h3>دستگاه: {schedule.equipment_name}</h3>

            <div className="card">
                <h4>چک‌لیست</h4>
                {checklist.map((item, index) => (
                    <div key={index} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                        <p style={{ fontWeight: 'bold' }}>{index + 1}. {item.label}</p>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {item.type === 'pass_fail' && (
                                <select
                                    value={results[index]?.status}
                                    onChange={(e) => handleResultChange(index, 'status', e.target.value)}
                                >
                                    <option value="pass">تایید</option>
                                    <option value="fail">رد</option>
                                    <option value="na">N/A</option>
                                </select>
                            )}

                            {item.type === 'numeric' && (
                                <input
                                    type="number"
                                    placeholder="مقدار"
                                    value={results[index]?.value}
                                    onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                                    style={{ width: '100px', marginBottom: 0 }}
                                />
                            )}

                            {item.type === 'text' && (
                                <input
                                    type="text"
                                    placeholder="توضیحات"
                                    value={results[index]?.value}
                                    onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                                    style={{ marginBottom: 0 }}
                                />
                            )}

                            <input
                                type="text"
                                placeholder="یادداشت فنی"
                                value={results[index]?.notes}
                                onChange={(e) => handleResultChange(index, 'notes', e.target.value)}
                                style={{ flex: 1, marginBottom: 0 }}
                            />
                        </div>
                    </div>
                ))}

                <label style={{ marginTop: '1rem' }}>
                    توضیحات کلی:
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" style={{ width: '100%' }}></textarea>
                </label>

                <button className="btn btn-primary" onClick={handleSubmit} style={{ marginTop: '1rem' }}>
                    ثبت نهایی PM
                </button>
            </div>
        </div>
    );
};

export default PMExecution;
