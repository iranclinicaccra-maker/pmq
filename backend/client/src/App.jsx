import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import PMPlans from './pages/PMPlans';
import WorkOrders from './pages/WorkOrders';
import Reports from './pages/Reports';
import Parts from './pages/Parts';
import Locations from './pages/Locations';
import ServiceTickets from './pages/ServiceTickets';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import AssetDetails from './pages/AssetDetails';
import WorkOrderDetails from './pages/WorkOrderDetails';
import Help from './pages/Help';
import ActivityLog from './pages/ActivityLog';
import AdvancedReports from './pages/AdvancedReports';
import Calendar from './pages/Calendar';
import { runScheduler } from './scheduler';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

function AppRoutes() {
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            runScheduler();
        }
    }, [user]);

    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="equipment" element={<Equipment />} />
                <Route path="equipment/:id" element={<AssetDetails />} />
                <Route path="assets" element={<Equipment />} />
                <Route path="assets/:id" element={<AssetDetails />} />
                <Route path="service-tickets" element={<ServiceTickets />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="locations" element={<Locations />} />
                <Route path="settings" element={<Settings />} />
                <Route path="pms" element={<PMPlans />} />
                <Route path="work-orders" element={<WorkOrders />} />
                <Route path="work-orders/:id" element={<WorkOrderDetails />} />
                <Route path="parts" element={<Parts />} />
                <Route path="reports" element={<Reports />} />
                <Route path="advanced-reports" element={<AdvancedReports />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="help" element={<Help />} />
                <Route path="activity-log" element={<ActivityLog />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <HashRouter>
                <AppRoutes />
            </HashRouter>
        </AuthProvider>
    );
}

export default App;
