import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { BarChart3, Download, Calendar, DollarSign, Wrench, Package, Users, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';

const AdvancedReports = () => {
    const [reportType, setReportType] = useState('equipment_utilization');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        location: 'all',
        equipment: 'all',
        technician: 'all'
    });
    const [locations, setLocations] = useState([]);
    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchFilterData();
        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setDateTo(today.toISOString().split('T')[0]);
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    }, []);

    const fetchFilterData = async () => {
        try {
            const [locationsRes, assetsRes, usersRes] = await Promise.all([
                dbQuery('SELECT id, name FROM locations ORDER BY name'),
                dbQuery('SELECT id, name FROM assets ORDER BY name'),
                dbQuery("SELECT id, full_name FROM users WHERE role IN ('technician', 'manager', 'admin') ORDER BY full_name")
            ]);
            setLocations(locationsRes);
            setAssets(assetsRes);
            setUsers(usersRes);
        } catch (err) {
            console.error('Error fetching filter data:', err);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            let data = null;
            switch (reportType) {
                case 'equipment_utilization':
                    data = await generateEquipmentUtilizationReport();
                    break;
                case 'cost_analysis':
                    data = await generateCostAnalysisReport();
                    break;
                case 'maintenance_trends':
                    data = await generateMaintenanceTrendsReport();
                    break;
                case 'parts_consumption':
                    data = await generatePartsConsumptionReport();
                    break;
                case 'technician_performance':
                    data = await generateTechnicianPerformanceReport();
                    break;
                case 'compliance':
                    data = await generateComplianceReport();
                    break;
                default:
                    data = null;
            }
            setReportData(data);
        } catch (err) {
            console.error('Error generating report:', err);
            alert('Failed to generate report: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateEquipmentUtilizationReport = async () => {
        let query = `
            SELECT 
                a.id,
                a.name,
                a.model,
                l.name as location_name,
                COUNT(DISTINCT wo.id) as total_work_orders,
                SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed_work_orders,
                SUM(CASE WHEN wo.type = 'repair' THEN 1 ELSE 0 END) as repair_count,
                SUM(CASE WHEN wo.type = 'pm' THEN 1 ELSE 0 END) as pm_count,
                SUM(wo.cost) as total_cost
            FROM assets a
            LEFT JOIN locations l ON a.location_id = l.id
            LEFT JOIN work_orders wo ON a.id = wo.asset_id 
                AND wo.created_at BETWEEN ? AND ?
            WHERE 1=1
        `;

        const params = [dateFrom, dateTo + ' 23:59:59'];

        if (filters.location !== 'all') {
            query += ' AND a.location_id = ?';
            params.push(filters.location);
        }
        if (filters.equipment !== 'all') {
            query += ' AND a.id = ?';
            params.push(filters.equipment);
        }

        query += ' GROUP BY a.id, a.name, a.model, l.name ORDER BY total_work_orders DESC';

        const result = await dbQuery(query, params);
        return {
            title: 'Equipment Utilization Report',
            columns: ['Equipment', 'Model', 'Location', 'Total WOs', 'Completed', 'Repairs', 'PMs', 'Total Cost'],
            data: result.map(r => ({
                equipment: r.name,
                model: r.model || 'N/A',
                location: r.location_name || 'Unassigned',
                total_work_orders: r.total_work_orders || 0,
                completed: r.completed_work_orders || 0,
                repairs: r.repair_count || 0,
                pms: r.pm_count || 0,
                total_cost: `$${(r.total_cost || 0).toFixed(2)}`
            }))
        };
    };

    const generateCostAnalysisReport = async () => {
        let query = `
            SELECT 
                a.name as equipment_name,
                a.model,
                l.name as location_name,
                wo.type,
                COUNT(wo.id) as work_order_count,
                SUM(wo.cost) as total_cost,
                AVG(wo.cost) as avg_cost
            FROM work_orders wo
            JOIN assets a ON wo.asset_id = a.id
            LEFT JOIN locations l ON a.location_id = l.id
            WHERE wo.created_at BETWEEN ? AND ?
        `;

        const params = [dateFrom, dateTo + ' 23:59:59'];

        if (filters.location !== 'all') {
            query += ' AND a.location_id = ?';
            params.push(filters.location);
        }
        if (filters.equipment !== 'all') {
            query += ' AND a.id = ?';
            params.push(filters.equipment);
        }

        query += ' GROUP BY a.id, a.name, a.model, l.name, wo.type ORDER BY total_cost DESC';

        const result = await dbQuery(query, params);
        return {
            title: 'Cost Analysis Report',
            columns: ['Equipment', 'Model', 'Location', 'Type', 'WO Count', 'Total Cost', 'Avg Cost'],
            data: result.map(r => ({
                equipment: r.equipment_name,
                model: r.model || 'N/A',
                location: r.location_name || 'Unassigned',
                type: r.type,
                count: r.work_order_count,
                total_cost: `$${(r.total_cost || 0).toFixed(2)}`,
                avg_cost: `$${(r.avg_cost || 0).toFixed(2)}`
            }))
        };
    };

    const generateMaintenanceTrendsReport = async () => {
        const query = `
            SELECT 
                TO_CHAR(wo.created_at, 'YYYY-MM') as month,
                COUNT(*) as total_work_orders,
                SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN wo.status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN wo.type = 'pm' THEN 1 ELSE 0 END) as pm_count,
                SUM(CASE WHEN wo.type = 'repair' THEN 1 ELSE 0 END) as repair_count,
                SUM(wo.cost) as total_cost
            FROM work_orders wo
            WHERE wo.created_at BETWEEN ? AND ?
            GROUP BY TO_CHAR(wo.created_at, 'YYYY-MM')
            ORDER BY month DESC
        `;

        const result = await dbQuery(query, [dateFrom, dateTo + ' 23:59:59']);
        return {
            title: 'Maintenance Trends Report',
            columns: ['Month', 'Total WOs', 'Completed', 'Open', 'PMs', 'Repairs', 'Total Cost'],
            data: result.map(r => ({
                month: r.month,
                total: r.total_work_orders,
                completed: r.completed,
                open: r.open,
                pms: r.pm_count,
                repairs: r.repair_count,
                cost: `$${(r.total_cost || 0).toFixed(2)}`
            }))
        };
    };

    const generatePartsConsumptionReport = async () => {
        const query = `
            SELECT 
                p.name as part_name,
                p.part_number,
                COUNT(wp.id) as usage_count,
                SUM(wp.quantity_used) as total_quantity,
                p.cost,
                SUM(wp.quantity_used * p.cost) as total_cost
            FROM wo_parts wp
            JOIN parts p ON wp.part_id = p.id
            JOIN work_orders wo ON wp.work_order_id = wo.id
            WHERE wo.created_at BETWEEN ? AND ?
            GROUP BY p.id, p.name, p.part_number, p.cost
            ORDER BY total_quantity DESC
        `;

        const result = await dbQuery(query, [dateFrom, dateTo + ' 23:59:59']);
        return {
            title: 'Parts Consumption Report',
            columns: ['Part Name', 'Part Number', 'Times Used', 'Total Quantity', 'Unit Cost', 'Total Cost'],
            data: result.map(r => ({
                part: r.part_name,
                part_number: r.part_number || 'N/A',
                usage_count: r.usage_count,
                quantity: r.total_quantity,
                unit_cost: `$${(r.cost || 0).toFixed(2)}`,
                total_cost: `$${(r.total_cost || 0).toFixed(2)}`
            }))
        };
    };

    const generateTechnicianPerformanceReport = async () => {
        let query = `
            SELECT 
                u.full_name as technician_name,
                COUNT(wo.id) as total_assigned,
                SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN wo.status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN wo.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(wo.cost) as total_cost
            FROM users u
            LEFT JOIN work_orders wo ON u.id = wo.assigned_to 
                AND wo.created_at BETWEEN ? AND ?
            WHERE u.role IN ('technician', 'manager', 'admin')
        `;

        const params = [dateFrom, dateTo + ' 23:59:59'];

        if (filters.technician !== 'all') {
            query += ' AND u.id = ?';
            params.push(filters.technician);
        }

        query += ' GROUP BY u.id, u.full_name ORDER BY completed DESC';

        const result = await dbQuery(query, params);
        return {
            title: 'Technician Performance Report',
            columns: ['Technician', 'Total Assigned', 'Completed', 'Open', 'In Progress', 'Total Cost'],
            data: result.map(r => ({
                technician: r.technician_name,
                total: r.total_assigned || 0,
                completed: r.completed || 0,
                open: r.open || 0,
                in_progress: r.in_progress || 0,
                cost: `$${(r.total_cost || 0).toFixed(2)}`
            }))
        };
    };

    const generateComplianceReport = async () => {
        const today = new Date().toISOString().split('T')[0];
        const query = `
            SELECT 
                a.name,
                a.model,
                a.serial_number,
                l.name as location_name,
                a.last_calibration_date,
                a.next_calibration_date,
                CASE 
                    WHEN a.next_calibration_date < ? THEN 'Overdue'
                    WHEN a.next_calibration_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'Due Soon'
                    ELSE 'Compliant'
                END as status
            FROM assets a
            LEFT JOIN locations l ON a.location_id = l.id
            WHERE a.next_calibration_date IS NOT NULL
            ORDER BY a.next_calibration_date ASC
        `;

        const result = await dbQuery(query, [today]);
        return {
            title: 'Compliance Report (Calibration Status)',
            columns: ['Equipment', 'Model', 'Serial Number', 'Location', 'Last Calibration', 'Next Calibration', 'Status'],
            data: result.map(r => ({
                equipment: r.name,
                model: r.model || 'N/A',
                serial: r.serial_number || 'N/A',
                location: r.location_name || 'Unassigned',
                last_cal: r.last_calibration_date || 'N/A',
                next_cal: r.next_calibration_date || 'N/A',
                status: r.status
            }))
        };
    };

    const exportToExcel = () => {
        if (!reportData || !reportData.data || reportData.data.length === 0) {
            alert('No data to export');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(reportData.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, reportData.title.substring(0, 30));
        XLSX.writeFile(wb, `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const reportTypes = [
        { id: 'equipment_utilization', name: 'Equipment Utilization', icon: Wrench, description: 'Track equipment usage and work orders' },
        { id: 'cost_analysis', name: 'Cost Analysis', icon: DollarSign, description: 'Breakdown of maintenance costs' },
        { id: 'maintenance_trends', name: 'Maintenance Trends', icon: TrendingUp, description: 'Monthly maintenance statistics' },
        { id: 'parts_consumption', name: 'Parts Consumption', icon: Package, description: 'Most used parts and costs' },
        { id: 'technician_performance', name: 'Technician Performance', icon: Users, description: 'Work order completion by technician' },
        { id: 'compliance', name: 'Compliance Report', icon: BarChart3, description: 'Calibration status and compliance' }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Advanced Reports</h1>
            </div>

            {/* Report Type Selection */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Select Report Type</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {reportTypes.map(type => {
                        const Icon = type.icon;
                        return (
                            <div
                                key={type.id}
                                onClick={() => setReportType(type.id)}
                                style={{
                                    padding: '1rem',
                                    border: `2px solid ${reportType === type.id ? 'var(--primary-color)' : '#e2e8f0'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: reportType === type.id ? '#eff6ff' : 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <Icon size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
                                    <strong>{type.name}</strong>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {type.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Filters</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label>Date From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Date To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                    {reportType !== 'maintenance_trends' && reportType !== 'compliance' && (
                        <>
                            <div>
                                <label>Location</label>
                                <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
                                    <option value="all">All Locations</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                            {reportType !== 'technician_performance' && (
                                <div>
                                    <label>Equipment</label>
                                    <select value={filters.equipment} onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}>
                                        <option value="all">All Equipment</option>
                                        {assets.map(asset => (
                                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {reportType === 'technician_performance' && (
                                <div>
                                    <label>Technician</label>
                                    <select value={filters.technician} onChange={(e) => setFilters({ ...filters, technician: e.target.value })}>
                                        <option value="all">All Technicians</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
                        <BarChart3 size={18} /> {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            {/* Report Results */}
            {reportData && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>{reportData.title}</h2>
                        <button className="btn btn-success" onClick={exportToExcel}>
                            <Download size={18} /> Export to Excel
                        </button>
                    </div>

                    {reportData.data.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No data found for the selected criteria
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        {reportData.columns.map((col, idx) => (
                                            <th key={idx}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.data.map((row, idx) => (
                                        <tr key={idx}>
                                            {Object.values(row).map((val, vidx) => (
                                                <td key={vidx}>{val}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Generated on: {new Date().toLocaleString()} | Total Records: {reportData.data.length}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedReports;
