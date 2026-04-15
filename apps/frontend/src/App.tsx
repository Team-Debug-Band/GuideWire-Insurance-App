import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingWizard from './pages/OnboardingWizard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import { getToken, getUserRole } from './utils/auth';

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
    const token = getToken();
    const userRole = getUserRole();
    
    if (!token) return <Navigate to="/login" />;
    if (role && userRole !== role) return <Navigate to={userRole === 'ADMIN' ? '/admin' : '/dashboard'} />;
    
    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to={getToken() ? (getUserRole() === 'ADMIN' ? '/admin' : '/dashboard') : '/login'} />} />
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<OnboardingWizard />} />
                
                <Route 
                    path="/dashboard" 
                    element={
                        <PrivateRoute role="WORKER">
                            <WorkerDashboard />
                        </PrivateRoute>
                    } 
                />
                
                <Route 
                    path="/admin" 
                    element={
                        <PrivateRoute role="ADMIN">
                            <AdminDashboard />
                        </PrivateRoute>
                    } 
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
