import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const LoginRedirect = () => {
    const adminToken = localStorage.getItem('token');
    const customerToken = localStorage.getItem('customer_token');

    // Agar Admin pehle se logged in hai, toh direct dashboard bhejo
    if (adminToken) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Agar Customer pehle se logged in hai, toh home bhejo
    if (customerToken) {
        return <Navigate to="/" replace />;
    }

    // Agar koi logged in nahi hai, tabhi Login page dikhao
    return <Outlet />;
};

export default LoginRedirect;