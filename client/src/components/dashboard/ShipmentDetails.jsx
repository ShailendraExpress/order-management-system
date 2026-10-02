import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FiArrowLeft, FiTruck, FiMapPin, FiClock, 
    FiFileText, FiInfo, FiBox, FiUser, FiCheck 
} from 'react-icons/fi';
import swal from 'sweetalert';
import api, { getCsrfCookie } from '../../utils/api';

const ShipmentDetails = () => {
    // URL se ID nikalne ka robust tarika (Aapne /shipping/details/:id set kiya hoga)
    const params = useParams();
    const activeId = params.id || params.shipId || params.trackingId;
    
    const navigate = useNavigate();
    
    const [shipmentData, setShipmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Agar ID missing hai toh bas load band karo, api call mat karo
        if (!activeId || activeId === 'shipmentmanagement' || activeId === 'create') {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                if (typeof getCsrfCookie === 'function') {
                    await getCsrfCookie();
                }

                const response = await api.get(`/api/v1/admin/shipments/${activeId}`);
                
                if (isMounted) {
                    const responseData = response.data?.data || response.data || null;
                    if (responseData) {
                        setShipmentData(responseData);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("API Error:", error);
                    swal("Error", "Could not load shipment details.", "error");
                }
            } finally {
                if (isMounted) {
                    setLoading(false); 
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [activeId]);

    const handleRefresh = async () => {
        if (!activeId) return;
        setIsRefreshing(true);
        try {
            const response = await api.get(`/api/v1/admin/shipments/${activeId}`);
            const responseData = response.data?.data || response.data;
            if (responseData) {
                setShipmentData(responseData);
                swal("Refreshed", "Shipment tracking status is up to date!", "success");
            }
        } catch (error) {
            swal("Error", "Failed to refresh tracking status.", "error");
        } finally {
            setIsRefreshing(false);
        }
    };

    // Helper Variables
    const isDelivered = shipmentData?.status?.toLowerCase() === 'delivered';
    const customer = shipmentData?.order?.customer || {};

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans text-slate-800 flex flex-col">
            
            {/* 1. BACK BUTTON (Hamesha dikhega) */}
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-all cursor-pointer w-fit"
            >
                <FiArrowLeft /> Back to Shipment Management
            </button>

            {/* 2. HEADER CARD (Hamesha dikhega) */}
            <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
                        <FiTruck className="text-xl" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Shipment Tracking</h1>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center flex-wrap gap-1">
                            ID: <span className="font-mono text-slate-700 font-semibold">{activeId ? `SHIP-${activeId}` : 'N/A'}</span>
                            
                            {/* Agar data aa gaya tabhi status badge dikhao */}
                            {shipmentData && (
                                <>
                                    <span className="mx-1">•</span> Status:
                                    <span className={`ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                        isDelivered 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                        {shipmentData.status}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* View Order Button (Agar data aa gaya tabhi dikhega) */}
                {shipmentData?.order?.order_number && (
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/dashboard/orders/${shipmentData.order?.order_number}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                        <FiFileText /> View Order
                    </button>
                )}
            </div>

            {/* 3. DYNAMIC CONTENT AREA (Loader ya Data) */}
            <div className="flex-1 relative">
                
                {/* Agar Loading ho rahi hai */}
                {loading ? (
                    <div className="bg-white border border-slate-200/80 rounded-xl p-16 flex flex-col items-center justify-center gap-4 text-slate-500 shadow-sm min-h-[400px]">
                        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                        <p className="font-semibold text-sm tracking-wide">Fetching Tracking Details...</p>
                    </div>
                ) : !shipmentData ? (
                    
                    /* Agar Loading khatam par data nahi mila (404) */
                    <div className="bg-white border border-slate-200/80 rounded-xl p-16 flex flex-col items-center justify-center gap-2 text-center shadow-sm min-h-[400px]">
                        <FiInfo className="text-slate-400 text-5xl mb-2" />
                        <h2 className="text-lg font-bold text-slate-700">Shipment Data Not Found</h2>
                        <p className="text-sm text-slate-500 max-w-sm">We couldn't fetch details for ID <b>{activeId}</b>. It might have been deleted or doesn't exist.</p>
                    </div>
                    
                ) : (
                    
                    /* Agar Data successfully aa gaya */
                    <div className="w-full space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                            {/* LEFT COLUMN: TIMELINE */}
                            <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                                        <FiClock /> Tracking Timeline
                                    </h2>

                                    {/* Carrier Info Box */}
                                    <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-100 mb-6 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-md flex items-center justify-center text-slate-400 shrink-0">
                                            <FiBox size={24} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-900 text-base truncate">{shipmentData.carrier || 'Standard Carrier'} Shipping</p>
                                            <p className="text-xs text-slate-500 mt-0.5 font-medium flex gap-2">
                                                AWB: <span className="font-mono text-slate-700 font-bold">{shipmentData.tracking_id || 'PENDING'}</span>
                                                <span>•</span> 
                                                Weight: <span className="font-bold text-slate-700">{shipmentData.weight || 0} kg</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* DYNAMIC TIMELINE */}
                                    <div className="relative border-l-2 border-slate-200 ml-3 md:ml-6 mt-6 pb-2">
                                        {shipmentData.logs && shipmentData.logs.length > 0 ? (
                                            shipmentData.logs.map((log, index) => {
                                                const isActive = index === 0 && !isDelivered;
                                                const isCompleted = index !== 0 || isDelivered;

                                                return (
                                                    <div key={log.id || index} className="mb-8 pl-8 relative last:mb-0">
                                                        <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 bg-white flex items-center justify-center transition-all ${
                                                            isCompleted ? 'border-emerald-500 bg-emerald-500' :
                                                            isActive ? 'border-amber-500 bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.2)] animate-pulse' : 'border-slate-200'
                                                        }`}>
                                                            {isCompleted && <FiCheck className="text-white" size={10} />}
                                                        </div>
                                                        
                                                        <div className={`-mt-1.5 p-4 rounded-xl border transition-all ${
                                                            isActive ? 'bg-amber-50/40 border-amber-200 shadow-sm' : 'bg-white border-slate-100'
                                                        }`}>
                                                            <h3 className={`text-sm uppercase tracking-wider font-extrabold ${
                                                                isCompleted ? 'text-slate-800' : isActive ? 'text-amber-700' : 'text-slate-400'
                                                            }`}>
                                                                {log.status}
                                                            </h3>
                                                            <div className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                                                                {log.message || 'Status updated automatically.'}
                                                            </div>
                                                            
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs font-medium text-slate-500">
                                                                <span className="flex items-center gap-1.5">
                                                                    <FiClock size={12} className={isActive ? 'text-amber-500' : 'text-slate-400'}/> 
                                                                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                                                                </span>
                                                                <span className="flex items-center gap-1.5 text-slate-400">
                                                                    <FiMapPin size={12} /> {log.location || 'System Originated'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-slate-500 italic ml-4">No tracking logs available yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: SIDEBAR */}
                            <div className="space-y-6">
                                
                                {/* Customer Info Card */}
                                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                        <FiUser /> Receiver Details
                                    </h3>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold shadow-sm shrink-0">
                                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{customer.name || 'Unknown'}</p>
                                            <p className="text-xs text-slate-500 font-medium truncate">Order: <span className="font-mono">{shipmentData.order?.order_number || 'N/A'}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600 bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 space-y-2">
                                        <p className="flex items-center gap-2 truncate" title={customer.email}><span className="shrink-0 text-slate-400">📧</span> {customer.email || 'N/A'}</p>
                                        <p className="flex items-center gap-2"><span className="shrink-0 text-slate-400">📱</span> {customer.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Destination Info Card */}
                                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                        <FiMapPin /> Delivery Location
                                    </h3>
                                    <div className="text-sm text-slate-700 bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                                        <p className="font-medium leading-relaxed">
                                            {customer.name ? `Delivery intended for ${customer.name}.` : 'Address details pending synchronization.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Logistics Actions (Refresh Button) */}
                                {!isDelivered && (
                                    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                            <FiInfo /> Logistics Options
                                        </h3>
                                        <button 
                                            type="button"
                                            onClick={handleRefresh} 
                                            disabled={isRefreshing}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold transition-all text-xs shadow-sm cursor-pointer ${
                                                isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400'
                                            }`}
                                        >
                                            {isRefreshing ? (
                                                <>
                                                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
                                                    Refreshing...
                                                </>
                                            ) : (
                                                'Refresh Status'
                                            )}
                                        </button>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* SYSTEM LOG BAR */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-5 text-slate-600 text-sm flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                <FiClock size={18} />
                            </div>
                            <p className="leading-relaxed">
                                <span className="font-bold text-slate-900">System Log:</span> Record created on <span className="font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{shipmentData.created_at ? new Date(shipmentData.created_at).toLocaleString() : 'N/A'}</span>.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShipmentDetails;