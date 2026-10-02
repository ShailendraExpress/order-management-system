import React, { useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ allowedRole, allowedAdminRoles = [] }) => {
    const { isAdmin, isAuthenticated, isCustomerAuthenticated, user, admin } = useSelector((state) => state.auth);
    
    // Safety check: Read token directly from storage to prevent split-second redirects when Redux is loading
    const hasAdminToken = !!localStorage.getItem('token');
    const hasCustomerToken = !!localStorage.getItem('customer_token');

    // Extract and normalize current admin role securely
    const currentAdminRole = useMemo(() => {
        // Redux me user ya admin object jisme bhi data ho use extract karein
        const adminData = user || admin || {};
        let extractedRole = "super_admin"; // Fallback

        if (adminData?.role && typeof adminData.role === 'string') {
            extractedRole = adminData.role;
        } else if (adminData?.roles && Array.isArray(adminData.roles) && adminData.roles.length > 0) {
            extractedRole = adminData.roles[0].name;
        }

        let finalRole = extractedRole.toLowerCase().replace(/ /g, "_");
        
        // Handle "admin" case globally like we did in sidebar
        if (finalRole === 'admin') {
            finalRole = 'super_admin';
        }

        return finalRole;
    }, [user, admin]);

    if (allowedRole === 'admin') {
        const isAuth = (isAdmin && isAuthenticated) || hasAdminToken;
        
        // 1. Check if logged in
        if (!isAuth) {
            return <Navigate to="/admin" replace />;
        }

        // 2. Check Role-Based Access Control (RBAC) if roles are provided
        if (allowedAdminRoles.length > 0 && !allowedAdminRoles.includes(currentAdminRole)) {
            // Agar unauthorized user access karne ki koshish kare, toh usko dashboard bhej do
            console.warn(`Access Denied for role: ${currentAdminRole}`);
            return <Navigate to="/admin/dashboard" replace />;
        }

        return <Outlet />;
    }

    if (allowedRole === 'customer') {
        // Check Redux OR localStorage
        return isCustomerAuthenticated || hasCustomerToken ? <Outlet /> : <Navigate to="/login" replace />;
    }

    return <Navigate to="/login" replace />;
};

export const UnauthenticatedRoute = () => {
    const { isAdmin, isCustomerAuthenticated } = useSelector((state) => state.auth);
    const hasAdminToken = !!localStorage.getItem('token');
    const hasCustomerToken = !!localStorage.getItem('customer_token');

    // Prevent logged-in users from accessing login pages by redirecting them to their respective dashboards
    if (isAdmin || hasAdminToken) return <Navigate to="/admin/dashboard" replace />;
    if (isCustomerAuthenticated || hasCustomerToken) return <Navigate to="/" replace />;

    return <Outlet />;
};