import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dbQuery } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileText, Download, Filter, BarChart3, ShieldCheck, AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react';

const Reports = () => {
    const [filters, setFilters] = useState({
        type: 'work_orders',
        startDate: '',
        endDate: '',
        status: 'all',
        technician: 'all',
        equipment: 'all'
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [equipmentList, setEquipmentList] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const techs = await dbQuery("SELECT id, full_name FROM users WHERE role IN ('technician', 'manager', 'admin')");
            setTechnicians(techs);
            const equipment = await dbQuery("SELECT id, name FROM assets ORDER BY name ASC");
            setEquipmentList(equipment);
        };
        fetchData();
    }, []);

    const exportAssetsPDF = async () => {
        const assets = await dbQuery(`
            WITH RECURSIVE location_path AS (
                SELECT id, name, parent_id, CAST(name AS TEXT) as full_path
                FROM locations
                WHERE parent_id IS NULL
                UNION ALL
                SELECT l.id, l.name, l.parent_id, lp.full_path || ' > ' || l.name
                FROM locations l
                JOIN location_path lp ON l.parent_id = lp.id
            )
            SELECT a.*, lp.full_path as location_full_path
            FROM assets a
            LEFT JOIN location_path lp ON a.location_id = lp.id
        `);
        const doc = new jsPDF();
        doc.text('Asset Report', 14, 15);

        const tableColumn = ["ID", "Name", "Model", "SN", "Location", "Status"];
        const tableRows = [];

        assets.forEach(asset => {
            const assetData = [
                asset.id,
                asset.name,
                asset.model,
                asset.serial_number,
                asset.location_full_path || 'Unassigned',
                asset.status
            ];
            tableRows.push(assetData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save('assets_report.pdf');
    };

    const exportWOsExcel = async () => {
        const wos = await dbQuery(`
      WITH RECURSIVE location_path AS (
          SELECT id, name, parent_id, CAST(name AS TEXT) as full_path
          FROM locations
          WHERE parent_id IS NULL
          UNION ALL
          SELECT l.id, l.name, l.parent_id, lp.full_path || ' > ' || l.name
          FROM locations l
          JOIN location_path lp ON l.parent_id = lp.id
      )
      SELECT w.id, a.name as asset, lp.full_path as location, w.type, w.priority, w.status, w.due_date 
      FROM work_orders w 
      LEFT JOIN assets a ON w.asset_id = a.id
      LEFT JOIN location_path lp ON a.location_id = lp.id
    `);

        const ws = XLSX.utils.json_to_sheet(wos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "WorkOrders");
        XLSX.writeFile(wb, "work_orders_report.xlsx");
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            let query = '';
            let params = [];

            if (filters.type === 'work_orders') {
                query = `
          SELECT w.id, a.name as asset_name, a.image_url, w.type, w.priority, w.status, w.due_date, w.cost, u.full_name as assignee
          FROM work_orders w
          LEFT JOIN assets a ON w.asset_id = a.id
          LEFT JOIN users u ON w.assigned_to = u.id
          WHERE 1=1
        `;

                if (filters.startDate) {
                    query += ` AND w.due_date >= ?`;
                    params.push(filters.startDate);
                }
                if (filters.endDate) {
                    query += ` AND w.due_date <= ?`;
                    params.push(filters.endDate);
                }
                if (filters.status !== 'all') {
                    query += ` AND w.status = ?`;
                    params.push(filters.status);
                }
                if (filters.technician !== 'all') {
                    query += ` AND w.assigned_to = ?`;
                    params.push(filters.technician);
                }
                query += ` ORDER BY w.due_date DESC`;
            } else if (filters.type === 'assets') {
                query = `
          WITH RECURSIVE location_path AS (
              SELECT id, name, parent_id, CAST(name AS TEXT) as full_path
              FROM locations
              WHERE parent_id IS NULL
              UNION ALL
              SELECT l.id, l.name, l.parent_id, lp.full_path || ' > ' || l.name
              FROM locations l
              JOIN location_path lp ON l.parent_id = lp.id
          )
          SELECT a.id, a.name, a.model, a.serial_number, a.image_url, lp.full_path as location, a.status, a.purchase_date, a.price
          FROM assets a
          LEFT JOIN location_path lp ON a.location_id = lp.id
          WHERE 1=1
        `;

                if (filters.status !== 'all') {
                    query += ` AND a.status = ?`;
                    params.push(filters.status);
                }
                if (filters.startDate) {
                    query += ` AND a.purchase_date >= ?`;
                    params.push(filters.startDate);
                }
                if (filters.endDate) {
                    query += ` AND a.purchase_date <= ?`;
                    params.push(filters.endDate);
                }
                query += ` ORDER BY a.name ASC`;
            } else if (filters.type === 'equipment_repairs') {
                query = `
          SELECT a.id as asset_id, a.name as equipment_name, a.model, a.serial_number, a.image_url,
                 w.id as work_order_id, w.type, w.description, w.created_at, w.completed_date, 
                 w.cost, w.status
          FROM assets a
          LEFT JOIN work_orders w ON a.id = w.asset_id
          WHERE w.id IS NOT NULL
        `;

                if (filters.equipment !== 'all') {
                    query += ` AND a.id = ?`;
                    params.push(filters.equipment);
                }
                if (filters.startDate) {
                    query += ` AND w.created_at >= ?`;
                    params.push(filters.startDate);
                }
                if (filters.endDate) {
                    query += ` AND w.created_at <= ?`;
                    params.push(filters.endDate);
                }
                query += ` ORDER BY a.name ASC, w.created_at DESC`;
            }

            const data = await dbQuery(query, params);
            setResults(data);
        } catch (err) {
            console.error('Error generating report:', err);
            alert('Failed to generate report: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const exportCustomReport = () => {
        if (results.length === 0) return;

        // Calculate total cost if it's a cost-related report
        let totalCost = 0;
        if (filters.type === 'work_orders' || filters.type === 'equipment_repairs') {
            totalCost = results.reduce((sum, row) => sum + (parseFloat(row.cost) || 0), 0);
        }

        const ws = XLSX.utils.json_to_sheet(results);

        // Add total row for repair history
        if (filters.type === 'equipment_repairs' && totalCost > 0) {
            XLSX.utils.sheet_add_aoa(ws, [['', '', '', '', '', '', '', '', `Total Cost: ${totalCost.toFixed(2)}`]], { origin: -1 });
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CustomReport");
        XLSX.writeFile(wb, `custom_report_${filters.type}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const generateCompliancePDF = async (reportType) => {
        setLoading(true);
        try {
            const doc = new jsPDF();
            const today = new Date().toISOString().split('T')[0];

            if (reportType === 'pm_completion') {
                // PM Completion Rate
                const stats = await dbQuery(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status IN ('completed', 'closed') THEN 1 ELSE 0 END) as completed
                    FROM work_orders 
                    WHERE type = 'pm'
                `);

                const total = stats[0].total || 0;
                const completed = stats[0].completed || 0;
                const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

                doc.setFontSize(18);
                doc.text('PM Compliance Report', 14, 20);
                doc.setFontSize(12);
                doc.text(`Generated: ${today}`, 14, 30);

                doc.setDrawColor(0);
                doc.setFillColor(240, 240, 240);
                doc.rect(14, 40, 180, 40, 'F');

                doc.setFontSize(14);
                doc.text('Preventive Maintenance Completion Rate', 20, 55);
                doc.setFontSize(24);
                doc.setTextColor(rate >= 90 ? 0 : 200, rate >= 90 ? 150 : 0, 0); // Green if >= 90, Red if <
                doc.text(`${rate}%`, 20, 70);
                doc.setTextColor(0);

                doc.setFontSize(10);
                doc.text(`Total PM Work Orders: ${total}`, 100, 60);
                doc.text(`Completed: ${completed}`, 100, 70);

                // List Overdue PMs
                const overdue = await dbQuery(`
                    SELECT w.id, a.name, w.due_date, w.assigned_to
                    FROM work_orders w
                    JOIN assets a ON w.asset_id = a.id
                    WHERE w.type = 'pm' AND w.status NOT IN ('completed', 'closed') AND w.due_date < ?
                `, [today]);

                if (overdue.length > 0) {
                    doc.text('Overdue PM Tasks:', 14, 95);
                    autoTable(doc, {
                        startY: 100,
                        head: [['WO #', 'Asset', 'Due Date']],
                        body: overdue.map(o => [o.id, o.name, o.due_date]),
                    });
                }

                doc.save(`pm_compliance_${today}.pdf`);

            } else if (reportType === 'critical_history') {
                // Critical Equipment History (High/Critical Priority WOs)
                const criticalWOs = await dbQuery(`
                    SELECT w.id, a.name, w.type, w.priority, w.status, w.completed_date, w.description
                    FROM work_orders w
                    JOIN assets a ON w.asset_id = a.id
                    WHERE w.priority IN ('high', 'critical')
                    ORDER BY w.created_at DESC
                    LIMIT 50
                `);

                console.log('Critical WOs:', criticalWOs);

                if (!criticalWOs || !Array.isArray(criticalWOs)) {
                    throw new Error('Invalid data returned for Critical History');
                }

                doc.setFontSize(18);
                doc.text('Critical Maintenance History', 14, 20);
                doc.setFontSize(10);
                doc.text('Recent High/Critical Priority Work Orders', 14, 30);

                doc.text('Recent High/Critical Priority Work Orders', 14, 30);

                autoTable(doc, {
                    startY: 40,
                    head: [['ID', 'Asset', 'Type', 'Priority', 'Status', 'Completed', 'Description']],
                    body: criticalWOs.map(w => [w.id, w.name, w.type, w.priority, w.status, w.completed_date || '-', w.description]),
                });

                doc.save(`critical_history_${today}.pdf`);

            } else if (reportType === 'calibration_audit') {
                // Calibration Audit (Overdue or Upcoming)
                const assets = await dbQuery(`
                    SELECT name, model, serial_number, last_calibration_date, next_calibration_date
                    FROM assets 
                    WHERE next_calibration_date IS NOT NULL
                    ORDER BY next_calibration_date ASC
                `);

                console.log('Calibration Assets:', assets);

                if (!assets || !Array.isArray(assets)) {
                    throw new Error('Invalid data returned for Calibration Audit');
                }

                doc.setFontSize(18);
                doc.text('Calibration Compliance Audit', 14, 20);

                const overdue = assets.filter(a => a.next_calibration_date < today);
                const upcoming = assets.filter(a => a.next_calibration_date >= today);

                doc.setFontSize(12);
                doc.setTextColor(200, 0, 0);
                doc.text(`Overdue Assets: ${overdue.length}`, 14, 35);
                doc.setTextColor(0);

                if (overdue.length > 0) {
                    autoTable(doc, {
                        startY: 40,
                        head: [['Asset', 'Model', 'SN', 'Last Cal.', 'Next Cal. (Overdue)']],
                        body: overdue.map(a => [a.name, a.model, a.serial_number, a.last_calibration_date, a.next_calibration_date]),
                        headStyles: { fillColor: [200, 0, 0] }
                    });
                }

                const nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 40;
                doc.text('Upcoming Calibrations:', 14, nextY - 5);

                autoTable(doc, {
                    startY: nextY,
                    head: [['Asset', 'Model', 'SN', 'Last Cal.', 'Next Cal.']],
                    body: upcoming.slice(0, 20).map(a => [a.name, a.model, a.serial_number, a.last_calibration_date, a.next_calibration_date]),
                });

                doc.save(`calibration_audit_${today}.pdf`);
            }

        } catch (err) {
            console.error('Error generating compliance report:', err);
            alert(`Failed to generate report: ${err.message}\nCheck console for details.`);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total cost for display
    const getTotalCost = () => {
        if (results.length === 0) return 0;
        return results.reduce((sum, row) => sum + (parseFloat(row.cost) || 0), 0);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Reports & Analytics</h1>
                <Link to="/advanced-reports" className="btn btn-primary">
                    <BarChart3 size={18} /> Advanced Reports
                </Link>
            </div>

            <div className="card">
                <h3>Quick Export</h3>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-outline" onClick={exportAssetsPDF}>
                        <FileText size={18} /> Export Assets (PDF)
                    </button>
                    <button className="btn btn-outline" onClick={exportWOsExcel}>
                        <FileText size={18} /> Export Work Orders (Excel)
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <ShieldCheck size={24} style={{ marginRight: '0.75rem', color: '#8b5cf6' }} />
                    <h3 style={{ margin: 0 }}>Compliance Reports</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Generate audit-ready documentation for regulatory compliance (TJC, CMS, ISO).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <button className="btn btn-outline" onClick={() => generateCompliancePDF('pm_completion')} style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '1rem' }}>
                        <CheckCircle size={24} style={{ marginRight: '1rem', color: '#10b981' }} />
                        <div>
                            <div style={{ fontWeight: '600' }}>PM Completion Rate</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Verify PM compliance percentage</div>
                        </div>
                    </button>

                    <button className="btn btn-outline" onClick={() => generateCompliancePDF('critical_history')} style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '1rem' }}>
                        <AlertTriangle size={24} style={{ marginRight: '1rem', color: '#f59e0b' }} />
                        <div>
                            <div style={{ fontWeight: '600' }}>Critical History</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Log of high-risk repairs</div>
                        </div>
                    </button>

                    <button className="btn btn-outline" onClick={() => generateCompliancePDF('calibration_audit')} style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '1rem' }}>
                        <ClipboardList size={24} style={{ marginRight: '1rem', color: '#3b82f6' }} />
                        <div>
                            <div style={{ fontWeight: '600' }}>Calibration Audit</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Overdue and upcoming calibrations</div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3>Custom Reports</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label>Report Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => {
                                setFilters({ ...filters, type: e.target.value, status: 'all' });
                                setResults([]);
                            }}
                        >
                            <option value="work_orders">Work Orders</option>
                            <option value="assets">Assets</option>
                            <option value="equipment_repairs">Equipment Repair History</option>
                        </select>
                    </div>

                    {filters.type !== 'equipment_repairs' && (
                        <div>
                            <label>Status</label>
                            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <option value="all">All Statuses</option>
                                {filters.type === 'work_orders' ? (
                                    <>
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="closed">Closed</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="disposed">Disposed</option>
                                    </>
                                )}
                            </select>
                        </div>
                    )}

                    {filters.type === 'work_orders' && (
                        <div>
                            <label>Technician</label>
                            <select value={filters.technician} onChange={(e) => setFilters({ ...filters, technician: e.target.value })}>
                                <option value="all">All Technicians</option>
                                {technicians.map(tech => (
                                    <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {filters.type === 'equipment_repairs' && (
                        <div>
                            <label>Equipment</label>
                            <select value={filters.equipment} onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}>
                                <option value="all">All Equipment</option>
                                {equipmentList.map(eq => (
                                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label>Start Date</label>
                        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>

                    <div>
                        <label>End Date</label>
                        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                        <Filter size={18} /> {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                    {results.length > 0 && (
                        <button className="btn btn-success" onClick={exportCustomReport} style={{ backgroundColor: 'var(--success-color)', color: 'white' }}>
                            <Download size={18} /> Export to Excel
                        </button>
                    )}
                </div>

                {results.length > 0 && (
                    <>
                        {(filters.type === 'work_orders' || filters.type === 'equipment_repairs') && (
                            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>
                                <strong>Total Cost: ${getTotalCost().toFixed(2)}</strong>
                            </div>
                        )}
                        <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background-color)' }}>
                                        {Object.keys(results[0]).map(key => (
                                            <th key={key} style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', textTransform: 'capitalize' }}>
                                                {key.replace('_', ' ')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((row, i) => (
                                        <tr key={i}>
                                            {Object.entries(row).map(([key, val], j) => (
                                                <td key={j} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    {key === 'cost' && val ? `$${parseFloat(val).toFixed(2)}` :
                                                        key === 'image_url' ? (
                                                            <div style={{
                                                                width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden',
                                                                backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                border: '1px solid #e2e8f0'
                                                            }}>
                                                                {val ? (
                                                                    <img
                                                                        src={val.startsWith('data:') ? val : `file://${val}`}
                                                                        alt="Img"
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>No Img</span>
                                                                )}
                                                            </div>
                                                        ) : val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {results.length === 0 && !loading && (
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No data found. Adjust filters and click Generate.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Reports;
