import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Wrench, Package, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Calendar = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [filters, setFilters] = useState({
        showPMs: true,
        showWorkOrders: true,
        showCalibrations: true,
        location: 'all',
        equipment: 'all'
    });
    const [locations, setLocations] = useState([]);
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        fetchFilterData();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [currentDate, filters]);

    const fetchFilterData = async () => {
        try {
            const [locationsRes, assetsRes] = await Promise.all([
                dbQuery('SELECT id, name FROM locations ORDER BY name'),
                dbQuery('SELECT id, name FROM assets ORDER BY name')
            ]);
            setLocations(locationsRes);
            setAssets(assetsRes);
        } catch (err) {
            console.error('Error fetching filter data:', err);
        }
    };

    const fetchEvents = async () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayDate = new Date(year, month, 1);
        const lastDayDate = new Date(year, month + 1, 0);

        // Format as YYYY-MM-DD using local time
        const formatDate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const firstDay = formatDate(firstDayDate);
        const lastDay = formatDate(lastDayDate);

        try {
            const allEvents = [];

            // Fetch PM Plans
            if (filters.showPMs) {
                let pmQuery = `
                    SELECT 
                        p.id, p.title, p.next_due_date as date,
                        a.name as asset_name, a.id as asset_id,
                        l.name as location_name
                    FROM pm_plans p
                    JOIN assets a ON p.asset_id = a.id
                    LEFT JOIN locations l ON a.location_id = l.id
                    WHERE p.next_due_date BETWEEN ? AND ?
                `;
                const pmParams = [firstDay, lastDay];

                if (filters.location !== 'all') {
                    pmQuery += ' AND a.location_id = ?';
                    pmParams.push(filters.location);
                }
                if (filters.equipment !== 'all') {
                    pmQuery += ' AND a.id = ?';
                    pmParams.push(filters.equipment);
                }

                const pmPlans = await dbQuery(pmQuery, pmParams);
                pmPlans.forEach(pm => {
                    allEvents.push({
                        id: `pm-${pm.id}`,
                        type: 'pm',
                        title: pm.title,
                        date: pm.date,
                        asset_name: pm.asset_name,
                        asset_id: pm.asset_id,
                        location: pm.location_name || 'Unassigned',
                        color: '#3b82f6' // blue
                    });
                });
            }

            // Fetch Work Orders
            if (filters.showWorkOrders) {
                let woQuery = `
                    SELECT 
                        wo.id, wo.description, wo.due_date as date, wo.status, wo.type,
                        a.name as asset_name, a.id as asset_id,
                        l.name as location_name,
                        u.full_name as assigned_to
                    FROM work_orders wo
                    LEFT JOIN assets a ON wo.asset_id = a.id
                    LEFT JOIN locations l ON a.location_id = l.id
                    LEFT JOIN users u ON wo.assigned_to = u.id
                    WHERE wo.due_date BETWEEN ? AND ?
                    AND wo.status != 'completed'
                `;
                const woParams = [firstDay, lastDay];

                if (filters.location !== 'all') {
                    woQuery += ' AND a.location_id = ?';
                    woParams.push(filters.location);
                }
                if (filters.equipment !== 'all') {
                    woQuery += ' AND a.id = ?';
                    woParams.push(filters.equipment);
                }

                const workOrders = await dbQuery(woQuery, woParams);
                workOrders.forEach(wo => {
                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = wo.date < today;

                    allEvents.push({
                        id: `wo-${wo.id}`,
                        type: 'work_order',
                        title: wo.description || `${wo.type} - ${wo.asset_name}`,
                        date: wo.date,
                        asset_name: wo.asset_name || 'N/A',
                        asset_id: wo.asset_id,
                        location: wo.location_name || 'Unassigned',
                        status: wo.status,
                        assigned_to: wo.assigned_to,
                        color: isOverdue ? '#ef4444' : '#f97316', // red if overdue, orange otherwise
                        isOverdue
                    });
                });
            }

            // Fetch Calibrations
            if (filters.showCalibrations) {
                let calQuery = `
                    SELECT 
                        a.id, a.name as asset_name, a.next_calibration_date as date,
                        l.name as location_name
                    FROM assets a
                    LEFT JOIN locations l ON a.location_id = l.id
                    WHERE a.next_calibration_date BETWEEN ? AND ?
                    AND a.next_calibration_date IS NOT NULL
                `;
                const calParams = [firstDay, lastDay];

                if (filters.location !== 'all') {
                    calQuery += ' AND a.location_id = ?';
                    calParams.push(filters.location);
                }
                if (filters.equipment !== 'all') {
                    calQuery += ' AND a.id = ?';
                    calParams.push(filters.equipment);
                }

                const calibrations = await dbQuery(calQuery, calParams);
                calibrations.forEach(cal => {
                    allEvents.push({
                        id: `cal-${cal.id}`,
                        type: 'calibration',
                        title: `Calibration - ${cal.asset_name}`,
                        date: cal.date,
                        asset_name: cal.asset_name,
                        asset_id: cal.id,
                        location: cal.location_name || 'Unassigned',
                        color: '#10b981' // green
                    });
                });
            }

            setEvents(allEvents.map(e => ({
                ...e,
                date: typeof e.date === 'string' ? e.date.split('T')[0] : e.date
            })));
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const getEventsForDay = (day) => {
        if (!day) return [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        // Use local date formatting to match DB dates
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${year}-${m}-${d}`;
        return events.filter(event => event.date === dateStr);
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleEventClick = (event) => {
        if (event.type === 'work_order') {
            navigate(`/work-orders/${event.id.replace('wo-', '')}`);
        } else if (event.asset_id) {
            navigate(`/equipment/${event.asset_id}`);
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Maintenance Calendar</h1>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={filters.showPMs}
                                onChange={(e) => setFilters({ ...filters, showPMs: e.target.checked })}
                                style={{ marginRight: '0.5rem' }}
                            />
                            <Activity size={16} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                            Show PM Plans
                        </label>
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={filters.showWorkOrders}
                                onChange={(e) => setFilters({ ...filters, showWorkOrders: e.target.checked })}
                                style={{ marginRight: '0.5rem' }}
                            />
                            <Wrench size={16} style={{ marginRight: '0.5rem', color: '#f97316' }} />
                            Show Work Orders
                        </label>
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={filters.showCalibrations}
                                onChange={(e) => setFilters({ ...filters, showCalibrations: e.target.checked })}
                                style={{ marginRight: '0.5rem' }}
                            />
                            <Package size={16} style={{ marginRight: '0.5rem', color: '#10b981' }} />
                            Show Calibrations
                        </label>
                    </div>
                    <div>
                        <label>Location</label>
                        <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
                            <option value="all">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Equipment</label>
                        <select value={filters.equipment} onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}>
                            <option value="all">All Equipment</option>
                            {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>{asset.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-outline" onClick={previousMonth}>
                        <ChevronLeft size={18} /> Previous
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ margin: 0 }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                        <button className="btn btn-primary" onClick={goToToday}>
                            <CalendarIcon size={18} /> Today
                        </button>
                    </div>
                    <button className="btn btn-outline" onClick={nextMonth}>
                        Next <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e2e8f0' }}>
                    {/* Day Headers */}
                    {dayNames.map(day => (
                        <div key={day} style={{
                            padding: '0.75rem',
                            backgroundColor: '#f8fafc',
                            fontWeight: '600',
                            textAlign: 'center',
                            fontSize: '0.875rem'
                        }}>
                            {day}
                        </div>
                    ))}

                    {/* Calendar Days */}
                    {getDaysInMonth().map((day, index) => {
                        const dayEvents = day ? getEventsForDay(day) : [];
                        const isToday = day &&
                            day === new Date().getDate() &&
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() === new Date().getFullYear();

                        return (
                            <div
                                key={index}
                                style={{
                                    minHeight: '120px',
                                    padding: '0.5rem',
                                    backgroundColor: day ? 'white' : '#f8fafc',
                                    border: isToday ? '2px solid var(--primary-color)' : 'none',
                                    position: 'relative'
                                }}
                            >
                                {day && (
                                    <>
                                        <div style={{
                                            fontWeight: isToday ? '700' : '500',
                                            marginBottom: '0.25rem',
                                            color: isToday ? 'var(--primary-color)' : 'inherit'
                                        }}>
                                            {day}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {dayEvents.slice(0, 3).map(event => (
                                                <div
                                                    key={event.id}
                                                    onClick={() => handleEventClick(event)}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: '2px 4px',
                                                        backgroundColor: event.color + '20',
                                                        borderLeft: `3px solid ${event.color}`,
                                                        cursor: 'pointer',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    title={`${event.title}\n${event.asset_name}\n${event.location}`}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    +{dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="card" style={{ marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Legend</h3>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '20px', height: '20px', backgroundColor: '#3b82f620', borderLeft: '3px solid #3b82f6', marginRight: '0.5rem' }}></div>
                        <span>PM Plans</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '20px', height: '20px', backgroundColor: '#f9731620', borderLeft: '3px solid #f97316', marginRight: '0.5rem' }}></div>
                        <span>Work Orders</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '20px', height: '20px', backgroundColor: '#ef444420', borderLeft: '3px solid #ef4444', marginRight: '0.5rem' }}></div>
                        <span>Overdue Work Orders</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '20px', height: '20px', backgroundColor: '#10b98120', borderLeft: '3px solid #10b981', marginRight: '0.5rem' }}></div>
                        <span>Calibrations</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
