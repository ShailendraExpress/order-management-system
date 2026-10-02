import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const DashboardRedirect = () => {
    // Direct token check karein, Redux ka wait mat karein
    const adminToken = localStorage.getItem('token');
    const adminData = localStorage.getItem('admin_data');

    // Agar token hai, toh Dashboard dikhao, warna login par bhejo
    if (adminToken && adminData) {
        return <Outlet />;
    }

    return <Navigate to="/login" replace />;
};

export default DashboardRedirect;