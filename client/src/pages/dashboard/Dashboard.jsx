import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { authActions } from '../../store/auth-slice';

import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import TheSidebar from '../../components/dashboard/TheSidebar';
import DashboardContent from '../../components/dashboard/DashboardContent';

const Dashboard = () => {
    const { pathname } = useLocation();
    const dispatch = useDispatch();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // 🚀 AUTO-SYNC USER ROLE & PERMISSIONS ON PAGE REFRESH
    useEffect(() => {
        const syncUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                // Backend se latest roles aur permissions fetch karein
                const res = await axios.get('http://localhost:8000/api/v1/user-profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.data && res.data.user) {
                    const updatedUser = res.data.user;

                    // LocalStorage update karein
                    localStorage.setItem('admin_data', JSON.stringify(updatedUser));
                    localStorage.setItem('user', JSON.stringify(updatedUser));

                    // Redux state update karein
                    dispatch(authActions.adminLogin({
                        token: token,
                        user: updatedUser
                    }));
                }
            } catch (error) {
                console.error("Failed to sync latest user permissions on refresh", error);
            }
        };

        syncUserProfile();
    }, [dispatch]);

    const toggleSidebar = () => {
        if (window.innerWidth < 768) {
            setIsMobileOpen(prev => !prev);
        } else {
            setIsCollapsed(prev => !prev);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 m-0 p-0 relative">

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 bg-slate-950/60 z-40 md:hidden transition-opacity backdrop-blur-xs"
                />
            )}

            {/* Left Sidebar */}
            <div className={`
                fixed md:static inset-y-0 left-0 z-50 h-screen flex-shrink-0 bg-[#0B1120] m-0 p-0 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
                ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} 
                ${isCollapsed && window.innerWidth >= 768 ? 'md:w-20' : 'md:w-64'}
            `}>
                <TheSidebar isCollapsed={window.innerWidth >= 768 && isCollapsed} />
            </div>

            {/* Right Main Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-slate-50 m-0 p-0">

                {/* Top Navbar */}
                <DashboardNavbar onToggleSidebar={toggleSidebar} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 w-full p-1 sm:p-2 m-0">
                    <div className="flex flex-col w-full space-y-3 pb-8">
                        {pathname === '/admin/dashboard' && <DashboardContent />}
                        <Outlet />
                    </div>
                </main>

            </div>

        </div>
    );
};

export default Dashboard;