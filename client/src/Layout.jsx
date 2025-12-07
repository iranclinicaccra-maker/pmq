import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NotificationCenter from './components/NotificationCenter';
import {
    LayoutDashboard,
    Stethoscope,
    ClipboardList,
    Wrench,
    BarChart3,
    LogOut,
    Package,
    MapPin,
    Settings,
    HelpCircle,
    Ticket,
    Users,
    Calendar as CalendarIcon,
    FileText
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">PM</div>
                        <span className="sidebar-brand-text">PMQ System V2</span>
                    </div >
                    <NotificationCenter />
                </div >

                <div className="sidebar-user">
                    <div className="sidebar-user-name">
                        Welcome, {user?.full_name || 'User'}
                    </div>
                    <div className="sidebar-user-role">
                        {user?.role || 'Technician'}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/equipment" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Stethoscope size={20} />
                        Equipment
                    </NavLink>
                    <NavLink to="/service-tickets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Ticket size={20} />
                        Service Tickets
                    </NavLink>
                    <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <BarChart3 size={20} />
                        Reports
                    </NavLink>
                    <NavLink to="/locations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <MapPin size={20} />
                        Locations
                    </NavLink>
                    <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} />
                        User Management
                    </NavLink>

                    <div className="sidebar-divider"></div>

                    {/* Keeping these accessible */}
                    <NavLink to="/work-orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Wrench size={20} />
                        Work Orders
                    </NavLink>
                    <NavLink to="/parts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Package size={20} />
                        Parts & Inventory
                    </NavLink>
                    <NavLink to="/pms" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <CalendarIcon size={20} />
                        PM Plans
                    </NavLink>
                    <NavLink to="/calendar" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <CalendarIcon size={20} />
                        Calendar
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/activity-log" className="nav-link">
                        <FileText size={20} />
                        Activity Log
                    </NavLink>
                    <NavLink to="/help" className="nav-link">
                        <HelpCircle size={20} />
                        Help & Documentation
                    </NavLink>
                    <NavLink to="/settings" className="nav-link">
                        <Settings size={20} />
                        Settings
                    </NavLink>
                </div>

                <div className="sidebar-logout">
                    <button
                        onClick={logout}
                        className="btn sidebar-logout-btn"
                        style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            padding: '0.75rem'
                        }}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                    <div className="sidebar-credits">
                        Developed by:<br />
                        <strong>SHAHAB ABDOLAHI</strong>
                    </div>
                </div>
            </aside >
            <main className="main-content">
                <Outlet />
            </main>
        </div >
    );
};

export default Layout;
