import React, { useState, useEffect } from 'react';
import { FiTruck, FiMapPin, FiInfo, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert';

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from '../../utils/api'; 

const ShipmentManagement = () => {
    const navigate = useNavigate();
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Shipments Securely from Backend
    useEffect(() => {
        let isMounted = true;

        const fetchShipments = async () => {
            setLoading(true);
            try {
                // Ensure CSRF token is set before making the request
                if (typeof getCsrfCookie === 'function') {
                    await getCsrfCookie();
                }

                // ✅ FIX: Updated route to include '/admin/' matching your backend routing
                const response = await api.get('/api/v1/admin/shipments');
                
                if (isMounted) {
                    // Safely unwrap data to prevent undefined errors
                    const responseData = response.data?.data || response.data;
                    setShipments(Array.isArray(responseData) ? responseData : []);
                }
            } catch (error) {
                console.error("Error fetching shipments:", error);
                if (isMounted) {
                    swal("Error", "Could not load shipments from the database.", "error");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchShipments();

        return () => {
            isMounted = false;
        };
    }, []);

    // Utility: Format Date & Time gracefully
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">

            {/* HEADER SECTION */}
            <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
                        <FiTruck className="text-xl" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Shipment Tracking</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Track and manage active outbound shipments.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/admin/dashboard/shipping/create')}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                    <FiPlus size={16} /> Create Shipment
                </button>
            </div>

            {/* SHIPMENT TABLE SECTION */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden relative min-h-[300px]">
                
                {loading ? (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3 text-slate-500 z-10 min-h-[300px]">
                        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                        <p className="text-sm font-semibold tracking-wide">Loading Shipments...</p>
                    </div>
                ) : shipments.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
                        <FiInfo size={32} className="text-slate-400" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-700">No active shipments found.</h3>
                            <p className="text-xs text-slate-500 mt-1">Create your first shipment to get started!</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Shipment ID / AWB</th>
                                    <th className="px-6 py-4">Order Details</th>
                                    <th className="px-6 py-4">Carrier</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {shipments.map((ship) => {
                                    
                                    const status = ship.status?.toLowerCase() || '';
                                    const isDelivered = status === 'delivered';
                                    const isPending = ['pending', 'processing'].includes(status);

                                    return (
                                        <tr key={ship.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-sm text-slate-900">SHIP-{ship.id}</p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">{ship.tracking_id || 'PENDING AWB'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/admin/dashboard/orders/${ship.order?.order_number}`)}>
                                                    {ship.order?.order_number || 'N/A'}
                                                </p>
                                                <div className="flex items-center text-xs text-slate-500 font-medium gap-1.5 mt-0.5">
                                                    <FiMapPin size={12} className="text-slate-400" /> 
                                                    <span className="truncate max-w-[150px]" title={ship.order?.customer?.name}>
                                                        {ship.order?.customer?.name || 'Customer'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-700 font-extrabold uppercase tracking-wide">
                                                {ship.carrier || 'Standard'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border inline-block ${
                                                    isDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                    isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {ship.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                                {formatDateTime(ship.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/admin/dashboard/shipping/details/${ship.id}`)}
                                                    className="text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm cursor-pointer"
                                                >
                                                    Track
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShipmentManagement;