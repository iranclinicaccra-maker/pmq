import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import {
    LayoutDashboard,
    Activity,
    AlertTriangle,
    Wrench,
    XCircle,
    ClipboardList,
    Calendar,
    Trash2,
    RefreshCcw
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [stats, setStats] = useState({
        totalEquipment: 0,
        operational: 0,
        calibrationOverdue: 0,
        underMaintenance: 0,
        outOfService: 0,
        disposed: 0,
        openServiceTickets: 0
    });
    const [upcomingCalibrations, setUpcomingCalibrations] = useState([]);
    const [upcomingWork, setUpcomingWork] = useState([]);
    const [alertWindow, setAlertWindow] = useState(30);

    const fetchStats = async () => {
        try {
            // Fetch Settings first
            const settingsResult = await dbQuery('SELECT notification_window_days FROM app_settings WHERE id = 1');
            const windowDays = settingsResult && settingsResult.length > 0 ? settingsResult[0].notification_window_days : 30;
            setAlertWindow(windowDays);

            // 1. Total Equipment
            const totalResult = await dbQuery('SELECT COUNT(*) as count FROM assets');

            // 2. Operational (Status = 'active')
            const operationalResult = await dbQuery("SELECT COUNT(*) as count FROM assets WHERE status = 'active'");

            // 3. Calibration Overdue (Assets where next_calibration_date < today, regardless of status)
            const today = new Date().toISOString().split('T')[0];
            const overdueResult = await dbQuery(`
                SELECT COUNT(*) as count 
                FROM assets 
                WHERE next_calibration_date IS NOT NULL 
                AND next_calibration_date < ?
            `, [today]);

            // 4. Under Maintenance (Status = 'maintenance')
            const maintenanceResult = await dbQuery("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'");

            // 5. Out of Service (Status = 'retired' or 'broken')
            const outOfServiceResult = await dbQuery("SELECT COUNT(*) as count FROM assets WHERE status IN ('retired', 'broken')");

            // 6. Disposed (Status = 'disposed')
            const disposedResult = await dbQuery("SELECT COUNT(*) as count FROM assets WHERE status = 'disposed'");

            // 7. Active Work Orders (All types, status = open/in_progress/on_hold)
            const ticketsResult = await dbQuery("SELECT COUNT(*) as count FROM work_orders WHERE status IN ('open', 'in_progress', 'on_hold')");

            setStats({
                totalEquipment: totalResult[0].count,
                operational: operationalResult[0].count,
                calibrationOverdue: overdueResult[0].count,
                underMaintenance: maintenanceResult[0].count,
                outOfService: outOfServiceResult[0].count,
                disposed: disposedResult[0].count,
                openServiceTickets: ticketsResult[0].count
            });

            // Fetch Upcoming Calibrations (Next X Days based on settings) - show all statuses except disposed
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + windowDays);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            const upcomingResult = await dbQuery(`
                SELECT id, name as asset_name, model as description, last_calibration_date, next_calibration_date as due_date, status
                FROM assets
                WHERE status != 'disposed'
                AND next_calibration_date >= ? AND next_calibration_date <= ?
                ORDER BY next_calibration_date ASC
                LIMIT 5
            `, [today, targetDateStr]);

            // Add a status of 'Scheduled'
            const formattedUpcoming = upcomingResult.map(item => ({
                ...item,
                status: 'Scheduled'
            }));

            setUpcomingCalibrations(formattedUpcoming);

            // Fetch Upcoming Work Orders for Calendar (Next 7 Days)
            const calendarTargetDate = new Date();
            calendarTargetDate.setDate(calendarTargetDate.getDate() + 7);
            const calendarTargetDateStr = calendarTargetDate.toISOString().split('T')[0];

            const workResult = await dbQuery(`
                SELECT w.id, w.type, w.priority, w.due_date, a.name as asset_name
                FROM work_orders w
                LEFT JOIN assets a ON w.asset_id = a.id
                WHERE w.status IN ('open', 'in_progress') 
                AND w.due_date >= ? AND w.due_date <= ?
                ORDER BY w.due_date ASC
            `, [today, calendarTargetDateStr]);

            setUpcomingWork(workResult);

        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [location.key]); // Refetch when location changes (navigation)

    const KPICard = ({ title, count, icon: Icon, color, bgColor, onClick }) => (
        <div
            className="card"
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1.5rem',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{
                backgroundColor: bgColor,
                padding: '1rem',
                borderRadius: '50%',
                marginRight: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={32} color={color} />
            </div>
            <div>
                <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>{title}</div>
                <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1e293b' }}>{count}</div>
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Dashboard</h1>
                <button
                    className="btn btn-outline"
                    onClick={fetchStats}
                    title="Refresh Dashboard"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCcw size={18} /> Refresh
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Row 1 */}
                <KPICard
                    title="Total Equipment"
                    count={stats.totalEquipment}
                    icon={LayoutDashboard}
                    color="#ffffff"
                    bgColor="#3b82f6" // Blue
                    onClick={() => navigate('/assets')}
                />
                <KPICard
                    title="Operational"
                    count={stats.operational}
                    icon={Activity}
                    color="#ffffff"
                    bgColor="#22c55e" // Green
                    onClick={() => navigate('/assets?status=active')}
                />
                <KPICard
                    title="Calibration Overdue"
                    count={stats.calibrationOverdue}
                    icon={AlertTriangle}
                    color="#ffffff"
                    bgColor="#ef4444" // Red
                    onClick={() => navigate('/assets?status=overdue')}
                />

                {/* Row 2 */}
                <KPICard
                    title="Under Maintenance"
                    count={stats.underMaintenance}
                    icon={Wrench}
                    color="#ffffff"
                    bgColor="#eab308" // Yellow
                    onClick={() => navigate('/assets?status=maintenance')}
                />
                <KPICard
                    title="Out of Service"
                    count={stats.outOfService}
                    icon={XCircle}
                    color="#ffffff"
                    bgColor="#dc2626" // Darker Red
                    onClick={() => navigate('/assets?status=retired')}
                />
                <KPICard
                    title="Disposed"
                    count={stats.disposed}
                    icon={Trash2}
                    color="#ffffff"
                    bgColor="#6b7280" // Gray
                    onClick={() => navigate('/assets?status=disposed')}
                />
                <KPICard
                    title="Active Work Orders"
                    count={stats.openServiceTickets}
                    icon={ClipboardList}
                    color="#ffffff"
                    bgColor="#8b5cf6" // Purple
                    onClick={() => navigate('/service-tickets')}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {/* Upcoming Calibrations Section */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', margin: 0 }}>
                            <Calendar size={20} style={{ marginRight: '0.5rem', color: '#64748b' }} />
                            Upcoming Calibrations (Next {alertWindow} Days)
                        </h2>
                        <button className="btn btn-outline" onClick={() => navigate('/assets')}>View All</button>
                    </div>

                    {upcomingCalibrations.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b' }}>Asset Name</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b' }}>Description</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b' }}>Due Date</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingCalibrations.map(wo => (
                                    <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{wo.asset_name}</td>
                                        <td style={{ padding: '0.75rem' }}>{wo.description}</td>
                                        <td style={{ padding: '0.75rem', color: '#ef4444', fontWeight: '500' }}>{wo.due_date}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                backgroundColor: '#e0f2fe',
                                                color: '#0369a1',
                                                fontWeight: '600'
                                            }}>
                                                {wo.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            No equipment due for calibration in the next {alertWindow} days.
                        </div>
                    )}
                </div>

                {/* Work Calendar */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={20} color="var(--primary-color)" />
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Work Calendar (Next 7 Days)</h3>
                        </div>
                        <button className="btn btn-outline" onClick={() => navigate('/service-tickets')}>View All</button>
                    </div>
                    {upcomingWork.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {upcomingWork.map(work => (
                                <div key={work.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)',
                                    borderLeft: `4px solid ${work.priority === 'critical' ? '#ef4444' : work.priority === 'high' ? '#f59e0b' : '#3b82f6'}`
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{work.asset_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{work.type}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '500' }}>{work.due_date}</div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: work.priority === 'critical' ? '#ef4444' : 'var(--text-secondary)' }}>
                                            {work.priority}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>No work scheduled for the next 7 days.</p>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                Developed by: <span style={{ fontWeight: '700', color: '#cbd5e1' }}>SHAHAB ABDOLAHI</span>
            </div>
        </div>
    );
};

export default Dashboard;
