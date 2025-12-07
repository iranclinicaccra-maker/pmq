import React, { useState } from 'react';
import {
    LayoutDashboard, Stethoscope, Ticket, BarChart3,
    MapPin, Users, Settings, Wrench, Package, Calendar,
    ChevronDown, ChevronRight, Search
} from 'lucide-react';

const Help = () => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            content: (
                <div>
                    <h3>Dashboard Overview</h3>
                    <p>The Dashboard provides a real-time overview of your medical equipment management system with key performance indicators (KPIs) and alerts.</p>

                    <h4>KPI Cards:</h4>
                    <ul>
                        <li><strong>Total Equipment:</strong> Total number of assets in the system. Click to view all equipment.</li>
                        <li><strong>Operational:</strong> Assets with 'active' status. Click to filter active equipment.</li>
                        <li><strong>Calibration Overdue:</strong> Assets past their calibration due date. Click to view and take action.</li>
                        <li><strong>Under Maintenance:</strong> Equipment currently being serviced.</li>
                        <li><strong>Out of Service:</strong> Retired or broken equipment.</li>
                        <li><strong>Disposed:</strong> Equipment that has been disposed of. Click to view disposal certificates.</li>
                        <li><strong>Active Work Orders:</strong> Open, in-progress, or on-hold work orders.</li>
                    </ul>

                    <h4>Upcoming Calibrations:</h4>
                    <p>Displays assets due for calibration within the next 30 days (configurable in Settings). Shows asset name, model, due date, and status.</p>

                    <h4>Work Calendar:</h4>
                    <p>Shows all upcoming work orders and PMs for the next 7 days with priority indicators.</p>
                </div>
            )
        },
        {
            id: 'equipment',
            title: 'Equipment Management',
            icon: <Stethoscope size={20} />,
            content: (
                <div>
                    <h3>Managing Equipment</h3>
                    <p>The Equipment Inventory page is the central hub for all your medical assets.</p>

                    <h4>Adding Equipment:</h4>
                    <ol>
                        <li>Click <strong>"Add Equipment"</strong> button.</li>
                        <li>Fill in required details:
                            <ul>
                                <li>Name, Model, Serial Number, Manufacturer</li>
                                <li>Purchase Date, Price, Warranty Expiry</li>
                                <li>Location (hierarchical selection)</li>
                                <li>Status (Active, Inactive, Maintenance, Disposed)</li>
                            </ul>
                        </li>
                        <li>Add calibration information:
                            <ul>
                                <li>Registration Number</li>
                                <li>Last/Next Calibration Dates</li>
                            </ul>
                        </li>
                        <li>Enter vendor and technician details (optional)</li>
                        <li>Upload equipment image and user manual (optional)</li>
                        <li>Click <strong>"Save Asset"</strong>.</li>
                    </ol>

                    <h4>Filtering:</h4>
                    <ul>
                        <li><strong>Search:</strong> Search by name, model, serial number, manufacturer, or location</li>
                        <li><strong>Status Filter:</strong> All, Active, Maintenance, Calibration Overdue, Retired, Disposed</li>
                    </ul>

                    <h4>Bulk Operations:</h4>
                    <ul>
                        <li><strong>Download Template:</strong> Get an Excel template for bulk import</li>
                        <li><strong>Import:</strong> Upload populated Excel file to add multiple assets</li>
                        <li><strong>Export:</strong> Download entire inventory as Excel</li>
                    </ul>

                    <h4>Equipment Details:</h4>
                    <p>Click "View" to see complete asset information, QR code, maintenance history, PM schedule, and work orders.</p>

                    <h4>Disposal:</h4>
                    <p>Mark equipment as disposed and generate official disposal certificates (PDF).</p>
                </div>
            )
        },
        {
            id: 'pm-plans',
            title: 'PM Plans & Execution',
            icon: <Wrench size={20} />,
            content: (
                <div>
                    <h3>Preventive Maintenance Plans</h3>
                    <p>Create recurring maintenance schedules with custom checklists.</p>

                    <h4>Creating a PM Plan:</h4>
                    <ol>
                        <li>Navigate to PM Plans page</li>
                        <li>Click "Create PM Plan"</li>
                        <li>Select the asset to maintain</li>
                        <li>Enter plan title (e.g., "Monthly Inspection")</li>
                        <li>Set frequency:
                            <ul>
                                <li>Daily (1 day)</li>
                                <li>Weekly (7 days)</li>
                                <li>Monthly (30 days)</li>
                                <li>Quarterly (90 days)</li>
                                <li>Semi-Annual (180 days)</li>
                                <li>Annual (365 days)</li>
                                <li>Custom (specify days)</li>
                            </ul>
                        </li>
                        <li>Build checklist:
                            <ul>
                                <li>Checkbox - for yes/no checks</li>
                                <li>Text - for notes and observations</li>
                                <li>Number - for measurements</li>
                            </ul>
                        </li>
                        <li>Set next due date</li>
                        <li>Save the plan</li>
                    </ol>

                    <h4>PM Execution:</h4>
                    <p>When a PM is due, a work order is automatically generated. Navigate to PM Execution to complete the checklist, add notes, and mark as complete. The next due date is automatically calculated.</p>

                    <h4>PM Records:</h4>
                    <p>All completed PMs are archived with execution date, technician, checklist results, and notes for compliance and audit trails.</p>
                </div>
            )
        },
        {
            id: 'service-tickets',
            title: 'Work Orders',
            icon: <Ticket size={20} />,
            content: (
                <div>
                    <h3>Work Order Management</h3>
                    <p>Track all maintenance activities including repairs, installations, and preventive maintenance.</p>

                    <h4>Creating a Work Order:</h4>
                    <ol>
                        <li>Click "New Ticket"</li>
                        <li>Select asset from dropdown</li>
                        <li>Choose work order type:
                            <ul>
                                <li><strong>PM:</strong> Preventive maintenance</li>
                                <li><strong>Repair:</strong> Corrective maintenance</li>
                                <li><strong>Installation:</strong> New equipment setup</li>
                            </ul>
                        </li>
                        <li>Set priority (Low, Medium, High, Critical)</li>
                        <li>Enter description and notes</li>
                        <li>Set due date</li>
                        <li>Assign to technician</li>
                        <li>Add parts used (optional)</li>
                        <li>Enter cost</li>
                    </ol>

                    <h4>Work Order Statuses:</h4>
                    <ul>
                        <li><strong>Open:</strong> New work order, not yet started</li>
                        <li><strong>In Progress:</strong> Technician is working on it</li>
                        <li><strong>On Hold:</strong> Paused (waiting for parts, approval, etc.)</li>
                        <li><strong>Completed:</strong> Work finished, awaiting verification</li>
                        <li><strong>Closed:</strong> Verified and closed</li>
                    </ul>

                    <h4>Priority Color Codes:</h4>
                    <ul>
                        <li><strong style={{ color: '#3b82f6' }}>Low:</strong> Blue</li>
                        <li><strong style={{ color: '#f59e0b' }}>High:</strong> Orange</li>
                        <li><strong style={{ color: '#ef4444' }}>Critical:</strong> Red</li>
                    </ul>

                    <h4>Parts Tracking:</h4>
                    <p>When adding parts to a work order, the system automatically deducts from inventory and tracks costs.</p>
                </div>
            )
        },
        {
            id: 'parts',
            title: 'Parts & Inventory',
            icon: <Package size={20} />,
            content: (
                <div>
                    <h3>Spare Parts Management</h3>
                    <p>Maintain an inventory of spare parts with stock tracking and low stock alerts.</p>

                    <h4>Adding Parts:</h4>
                    <ol>
                        <li>Navigate to Parts page</li>
                        <li>Click "Add Part"</li>
                        <li>Enter part details:
                            <ul>
                                <li>Name and Part Number</li>
                                <li>Current Quantity</li>
                                <li>Minimum Quantity (for low stock alerts)</li>
                                <li>Unit Cost</li>
                                <li>Description</li>
                            </ul>
                        </li>
                        <li>Upload part image (optional)</li>
                        <li>Save</li>
                    </ol>

                    <h4>Low Stock Alerts:</h4>
                    <p>When a part's quantity falls below the minimum threshold, it is highlighted in red on the Parts page.</p>

                    <h4>Usage Tracking:</h4>
                    <p>Every time a part is used in a work order, the quantity is automatically reduced and usage is logged.</p>

                    <h4>Bulk Import/Export:</h4>
                    <p>Import parts from Excel or export current inventory for purchasing and auditing.</p>
                </div>
            )
        },
        {
            id: 'locations',
            title: 'Location Management',
            icon: <MapPin size={20} />,
            content: (
                <div>
                    <h3>Hierarchical Locations</h3>
                    <p>Organize your equipment by physical location with unlimited hierarchy levels.</p>

                    <h4>Location Structure:</h4>
                    <p>Create multi-level locations like:</p>
                    <ul>
                        <li>Main Hospital (root)
                            <ul>
                                <li>Building A
                                    <ul>
                                        <li>Floor 1
                                            <ul>
                                                <li>Room 101</li>
                                                <li>Room 102</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>

                    <h4>Adding Locations:</h4>
                    <ol>
                        <li>Go to Locations page</li>
                        <li>Click "Add Location"</li>
                        <li>Enter location name</li>
                        <li>Select parent location (or leave empty for root)</li>
                        <li>Save</li>
                    </ol>

                    <h4>Full Path Display:</h4>
                    <p>In reports and equipment lists, locations are shown with their full hierarchical path for clarity.</p>
                </div>
            )
        },
        {
            id: 'reports',
            title: 'Reports & Analytics',
            icon: <BarChart3 size={20} />,
            content: (
                <div>
                    <h3>Reporting & Analytics</h3>
                    <p>Generate comprehensive reports with charts and export capabilities.</p>

                    <h4>Available Reports:</h4>
                    <ul>
                        <li><strong>Asset Status Report:</strong> Pie chart breakdown of equipment by status</li>
                        <li><strong>Maintenance Cost Analysis:</strong> Bar chart of monthly maintenance expenses</li>
                        <li><strong>Work Order Summary:</strong> Overview of work orders by type and status</li>
                        <li><strong>Calibration Report:</strong> List of upcoming and overdue calibrations</li>
                        <li><strong>PM Compliance:</strong> PM completion rates</li>
                    </ul>

                    <h4>Advanced Reports:</h4>
                    <p>Navigate to Advanced Reports for detailed filtering:</p>
                    <ul>
                        <li>Filter by date range</li>
                        <li>Filter by location</li>
                        <li>Filter by status, type, priority</li>
                        <li>Export to Excel or PDF</li>
                    </ul>

                    <h4>Activity Log:</h4>
                    <p>Complete audit trail of all user actions including:</p>
                    <ul>
                        <li>User login/logout</li>
                        <li>Asset creation/modification/deletion</li>
                        <li>Work order updates</li>
                        <li>PM executions</li>
                        <li>Settings changes</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'users',
            title: 'User Management',
            icon: <Users size={20} />,
            content: (
                <div>
                    <h3>User Management & Roles</h3>
                    <p>Control access with role-based permissions.</p>

                    <h4>User Roles:</h4>
                    <ul>
                        <li><strong>Admin:</strong> Full access to all features including user management and settings</li>
                        <li><strong>Manager:</strong> Can view reports, manage work orders, and equipment</li>
                        <li><strong>Technician:</strong> Can execute work orders and PMs, update equipment status</li>
                    </ul>

                    <h4>Adding Users:</h4>
                    <ol>
                        <li>Navigate to User Management (Admin only)</li>
                        <li>Click "Add User"</li>
                        <li>Enter username, full name, email</li>
                        <li>Set password</li>
                        <li>Select role</li>
                        <li>Save</li>
                    </ol>

                    <h4>Default Account:</h4>
                    <p>Username: <code>admin</code> | Password: <code>admin</code></p>
                    <p style={{ color: 'var(--danger-color)' }}>⚠️ Change the default password immediately after first login!</p>
                </div>
            )
        },
        {
            id: 'settings',
            title: 'Settings & Configuration',
            icon: <Settings size={20} />,
            content: (
                <div>
                    <h3>System Configuration</h3>
                    <p>Customize the application to fit your workflow.</p>

                    <h4>General Settings:</h4>
                    <ul>
                        <li><strong>Notification Window:</strong> Number of days before calibration due to show alerts (default: 30)</li>
                        <li><strong>Currency:</strong> Select from USD, EUR, GBP, IRR, AED, SAR, GHS</li>
                    </ul>

                    <h4>Database Management:</h4>
                    <ul>
                        <li><strong>Database Location:</strong> View current database path</li>
                        <li><strong>Open Database Folder:</strong> Quick access to database location</li>
                        <li><strong>Backup Database:</strong> Create manual backup (saved as .sqlite file)</li>
                        <li><strong>Restore Database:</strong> Restore from previous backup</li>
                        <li><strong>Auto Backup:</strong> Enable weekly automatic backups</li>
                    </ul>

                    <h4>Backup Location:</h4>
                    <p><code>C:\Users\[Username]\AppData\Roaming\pmq\backups\</code></p>

                    <h4>Best Practices:</h4>
                    <ul>
                        <li>Enable auto-backup for weekly protection</li>
                        <li>Create manual backups before major changes</li>
                        <li>Store backups in external location for disaster recovery</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'build',
            title: 'Build & Installation',
            icon: <Calendar size={20} />,
            content: (
                <div>
                    <h3>Building & Deploying</h3>
                    <p>Instructions for creating an installer for deployment.</p>

                    <h4>Build Process:</h4>
                    <ol>
                        <li>Open terminal in project directory</li>
                        <li>Run: <code>npm run build</code></li>
                        <li>Wait for Vite to build React app</li>
                        <li>Wait for electron-builder to create installer</li>
                        <li>Find installer at: <code>release\Medical PM Manager-0.0.0-Setup.exe</code></li>
                    </ol>

                    <h4>Installation on Other Computers:</h4>
                    <ol>
                        <li>Copy the Setup.exe file to the target computer</li>
                        <li>Run the installer</li>
                        <li>Choose installation directory (or use default)</li>
                        <li>Wait for installation to complete</li>
                        <li>Launch from Start Menu or Desktop shortcut</li>
                    </ol>

                    <h4>System Requirements:</h4>
                    <ul>
                        <li>Windows 10 or later (64-bit)</li>
                        <li>500 MB disk space</li>
                        <li>No additional dependencies required</li>
                    </ul>

                    <h4>Troubleshooting Installation:</h4>
                    <ul>
                        <li>If ICU error appears, ensure you're using the latest build</li>
                        <li>Run installer as Administrator if permission issues occur</li>
                        <li>Antivirus may flag the app - add exception if needed</li>
                    </ul>
                </div>
            )
        }
    ];

    const filteredSections = sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 2rem)', gap: '2rem' }}>
            {/* Sidebar Navigation */}
            <div className="card" style={{ width: '250px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search help..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', paddingLeft: '2rem' }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>

                {filteredSections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            border: 'none',
                            background: activeSection === section.id ? 'var(--primary-color)' : 'transparent',
                            color: activeSection === section.id ? 'white' : 'var(--text-primary)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                        }}
                    >
                        {section.icon}
                        <span style={{ fontWeight: 500 }}>{section.title}</span>
                        {activeSection === section.id && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                {sections.find(s => s.id === activeSection)?.content || (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                        Select a topic from the menu to view documentation.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Help;
