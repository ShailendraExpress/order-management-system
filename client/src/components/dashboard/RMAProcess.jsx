import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FiArrowLeft, FiCheck, FiX, FiPackage, FiUser,
    FiInfo, FiClock, FiFileText, FiRotateCcw, FiDollarSign, FiImage, FiEdit3, FiRefreshCw
} from "react-icons/fi";
import swal from "sweetalert";

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from "../../utils/api";

const RMAProcess = () => {
    const { rmaId } = useParams();
    const navigate = useNavigate();

    const [returnDetail, setReturnDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNote, setAdminNote] = useState("");
    const [customerMessage, setCustomerMessage] = useState(""); 
    const [activeNoteTab, setActiveNoteTab] = useState('internal'); 
    const [isSavingNote, setIsSavingNote] = useState(false); 

    // Synchronize local state with API response data
    useEffect(() => {
        if (returnDetail) {
            setAdminNote(returnDetail.admin_note || "");
            setCustomerMessage(returnDetail.customer_message || "");
        }
    }, [returnDetail]);

    // Fetch RMA details securely on component mount
    useEffect(() => {
        let isMounted = true;

        const fetchReturnDetails = async () => {
            try {
                if (typeof getCsrfCookie === 'function') {
                    await getCsrfCookie();
                }

                // ✅ FIX: Added '/v1/' to match backend API routes and prevent 404 errors
                const response = await api.get(`/api/v1/admin/returns/${rmaId}`);
                
                if (isMounted && response.data) {
                    const responseData = response.data.data || response.data;
                    setReturnDetail(responseData);
                }
            } catch (error) {
                console.error("Error fetching RMA details:", error);
                if (isMounted) {
                    swal("Error", "Failed to retrieve RMA details. Please try again.", "error");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchReturnDetails();

        return () => {
            isMounted = false;
        };
    }, [rmaId]);

    // Handle saving internal notes and customer messages
    const handleSaveNote = async () => {
        setIsSavingNote(true);
        try {
            if (typeof getCsrfCookie === 'function') {
                await getCsrfCookie();
            }

            const response = await api.post(`/api/v1/admin/returns/${rmaId}/status`, { 
                status: returnDetail.status,
                admin_note: adminNote,
                customer_message: customerMessage
            });

            if (response.data?.success || response.status === 200) {
                swal("Saved!", "Notes updated successfully.", "success");
                
                // Instantly reflect changes in UI without refreshing
                setReturnDetail(prev => ({
                    ...prev,
                    admin_note: adminNote,
                    customer_message: customerMessage
                }));
            }
        } catch (error) {
            console.error("Failed to save note:", error);
            swal("Error", "Failed to save notes. Please check your connection.", "error");
        } finally {
            setIsSavingNote(false);
        }
    };

    // Handle workflow status updates (Approve, Reject, Refund, Replace)
    const handleAction = async (newStatus) => {
        const actionLabels = {
            approved: 'Approve',
            rejected: 'Reject',
            refunded: 'Process Refund',
            replaced: 'Process Replacement',
            pending: 'Re-open'
        };

        const actionText = actionLabels[newStatus];

        const confirm = await swal({
            title: `Confirm ${actionText}`,
            text: newStatus === 'pending'
                ? "Are you sure you want to reset this request to Pending?"
                : `Are you sure you want to ${actionText.toLowerCase()} this return request?`,
            icon: (newStatus === 'rejected' || newStatus === 'pending') ? "warning" : "info",
            buttons: ["Cancel", `Yes, ${actionText}`],
            dangerMode: newStatus === 'rejected',
        });

        if (confirm) {
            setActionLoading(true);
            try {
                if (typeof getCsrfCookie === 'function') {
                    await getCsrfCookie();
                }

                const response = await api.post(`/api/v1/admin/returns/${rmaId}/status`, {
                    status: newStatus,
                    admin_note: adminNote,
                    customer_message: customerMessage
                });

                if (response.data?.success || response.status === 200) {
                    swal("Success!", `RMA has been successfully marked as ${newStatus}.`, "success");
                    setReturnDetail((prev) => ({ 
                        ...prev, 
                        status: newStatus,
                        admin_note: adminNote,
                        customer_message: customerMessage
                    }));
                }
            } catch (error) {
                console.error("Workflow action failed:", error);
                swal("Error", "Failed to process the request. Try again.", "error");
            } finally {
                setActionLoading(false);
            }
        }
    };

    const isCompleted = ['refunded', 'replaced'].includes(returnDetail?.status?.toLowerCase());
    const displayAction = isCompleted
        ? (returnDetail?.status?.toLowerCase() === 'refunded' ? 'Refund' : 'Replace')
        : returnDetail?.action;

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans text-slate-800">

            <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-all cursor-pointer"
            >
                <FiArrowLeft /> Back to Return Management
            </button>

            {/* HEADER CARD */}
            <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
                        <FiRotateCcw className="text-xl" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">RMA Processing</h1>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center flex-wrap gap-1">
                            ID: <span className="font-mono text-slate-700 font-semibold">RMA-{rmaId}</span> • Status:
                            <span className={`ml-1 font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded border ${
                                returnDetail?.status === 'approved' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                                returnDetail?.status === 'refunded' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                                returnDetail?.status === 'replaced' ? 'text-purple-600 bg-purple-50 border-purple-200' :
                                returnDetail?.status === 'rejected' ? 'text-rose-600 bg-rose-50 border-rose-200' :
                                returnDetail?.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                'text-slate-500 bg-slate-100 border-slate-200'
                            }`}>
                                {returnDetail?.status || 'Fetching...'}
                            </span>
                        </p>
                    </div>
                </div>
                
                {returnDetail?.order_id && (
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/dashboard/orders/${returnDetail.order_id}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
                    >
                        <FiFileText /> View Order / Invoice
                    </button>
                )}
            </div>

            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 font-bold bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                    <p>Loading Details for RMA-{rmaId}...</p>
                </div>
            ) : !returnDetail ? (
                <div className="bg-white p-16 rounded-xl border border-slate-200/80 text-slate-500 text-center font-medium shadow-sm flex flex-col items-center justify-center gap-2">
                    <FiInfo size={24} className="text-slate-400" />
                    <p>RMA Data not found or could not be loaded!</p>
                </div>
            ) : (
                <div className="w-full space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                            
                            {/* Product Info Block */}
                            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                                    <FiInfo /> Order & Item Details
                                </h2>

                                <div className="flex items-start gap-4 mb-6 p-4 bg-slate-50/70 rounded-lg border border-slate-100">
                                    <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-md flex items-center justify-center text-slate-400 shrink-0">
                                        <FiPackage size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                            <div className="truncate w-full">
                                                <p className="font-bold text-slate-900 text-base truncate" title={returnDetail.product?.name}>
                                                    {returnDetail.product?.name || 'Product Name Unavailable'}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                                                    Order ID: <span className="font-mono">{returnDetail.order_id || 'N/A'}</span> • 
                                                    {isCompleted ? 'Final Action:' : 'Requested Action:'}
                                                    <span className={`uppercase font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wider ${
                                                        displayAction?.toLowerCase() === 'refund' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {displayAction || 'N/A'}
                                                    </span>
                                                </p>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 shrink-0">
                                                ₹{returnDetail.order_item?.price ? Number(returnDetail.order_item.price).toLocaleString() : '0'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Customer Reason</h3>
                                        <div className="text-sm text-slate-700 bg-amber-50/50 p-3.5 rounded-lg border border-amber-100 italic leading-relaxed">
                                            "{returnDetail.reason || 'No specific reason provided by customer.'}"
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5 tracking-wider">
                                            <FiImage /> Evidence Uploaded
                                        </h3>
                                        <div className="flex gap-2">
                                            <div className="w-16 h-16 bg-slate-50 border border-dashed border-slate-300 rounded-md flex items-center justify-center text-slate-400 text-xs font-medium">No Img</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Notes Block */}
                            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
                                
                                {/* Official Message Box (Visible if saved) */}
                                {returnDetail?.customer_message && (
                                    <div className="mx-6 mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex items-start gap-3">
                                        <FiInfo className="text-blue-500 mt-0.5 shrink-0" size={16} />
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-blue-600 tracking-wider mb-1">Officially Sent to Customer</p>
                                            <p className="text-sm text-blue-900 font-medium whitespace-pre-wrap leading-relaxed">{returnDetail.customer_message}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Sleek Tab Header */}
                                <div className="flex border-b border-slate-200 bg-white px-6 pt-4 gap-8">
                                    <button
                                        type="button"
                                        onClick={() => setActiveNoteTab('internal')}
                                        className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all duration-200 cursor-pointer ${
                                            activeNoteTab === 'internal'
                                                ? 'border-slate-800 text-slate-900' 
                                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <FiEdit3 size={16} /> 
                                        Internal Note
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setActiveNoteTab('customer')}
                                        className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all duration-200 cursor-pointer ${
                                            activeNoteTab === 'customer'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <FiFileText size={16} /> 
                                        Customer Message
                                    </button>
                                </div>

                                {/* Text Input Area */}
                                <div className="p-6 bg-slate-50/30">
                                    <textarea 
                                        className={`w-full border rounded-xl p-4 text-sm outline-none transition-all focus:ring-2 resize-y min-h-[100px] ${
                                            activeNoteTab === 'internal' 
                                                ? 'bg-white border-slate-200 focus:ring-slate-800 text-slate-800 shadow-sm' 
                                                : 'bg-blue-50/20 border-blue-200 focus:ring-blue-500 text-blue-900 shadow-sm'
                                        }`}
                                        rows="4"
                                        placeholder={
                                            activeNoteTab === 'internal' 
                                                ? "Add internal remarks here (only visible to staff members)..." 
                                                : "E.g., Your return is rejected because the product tags were missing..."
                                        }
                                        value={activeNoteTab === 'internal' ? adminNote : customerMessage}
                                        onChange={(e) => {
                                            if (activeNoteTab === 'internal') {
                                                setAdminNote(e.target.value);
                                            } else {
                                                setCustomerMessage(e.target.value);
                                            }
                                        }}
                                    ></textarea>

                                    {/* Dynamic Save Button */}
                                    <div className="mt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                            {activeNoteTab === 'internal' ? '🔒 Private Note (Hidden from Customer)' : '👁️ Visible to Customer'}
                                        </span>
                                        
                                        <button 
                                            type="button"
                                            onClick={handleSaveNote}
                                            disabled={
                                                isSavingNote || 
                                                (activeNoteTab === 'internal' ? adminNote.trim() === '' : customerMessage.trim() === '')
                                            }
                                            className={`w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                                activeNoteTab === 'internal' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {isSavingNote ? "Saving..." : activeNoteTab === 'internal' ? "Save Internal Note" : "Save Message"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Customer & Actions */}
                        <div className="space-y-6">
                            
                            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2 tracking-wider">
                                    <FiUser /> Customer Information
                                </h3>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-11 h-11 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                                        {returnDetail.customer?.name ? returnDetail.customer.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{returnDetail.customer?.name || 'Unknown Customer'}</p>
                                        <p className="text-xs text-slate-500 font-medium truncate">Customer ID: <span className="font-mono">#{returnDetail.customer_id}</span></p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-600 bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 space-y-2">
                                    <p className="flex items-center gap-2 truncate" title={returnDetail.customer?.email}><span className="shrink-0 text-slate-400">📧</span> {returnDetail.customer?.email || 'N/A'}</p>
                                    <p className="flex items-center gap-2"><span className="shrink-0 text-slate-400">📱</span> {returnDetail.customer?.phone || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Actions Block */}
                            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-5 tracking-wider">Workflow Actions</h3>

                                <div className="space-y-3">
                                    {/* 1. If PENDING */}
                                    {returnDetail.status?.toLowerCase() === 'pending' && (
                                        <>
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => handleAction('approved')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm transition-all text-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                <FiCheck size={18} /> Approve Request
                                            </button>
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => handleAction('rejected')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold transition-all text-sm shadow-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                <FiX size={18} /> Reject Request
                                            </button>
                                        </>
                                    )}

                                    {/* 2. If APPROVED -> Show BOTH Refund and Replace options */}
                                    {returnDetail.status?.toLowerCase() === 'approved' && (
                                        <>
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => handleAction('refunded')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm transition-all text-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                <FiDollarSign size={18} /> Process Refund
                                            </button>
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => handleAction('replaced')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-sm transition-all text-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                <FiRefreshCw size={18} /> Process Replacement
                                            </button>
                                        </>
                                    )}

                                    {/* 3. ACTION ALREADY TAKEN + RE-OPEN BUTTON */}
                                    {['refunded', 'replaced', 'rejected'].includes(returnDetail.status?.toLowerCase()) && (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 opacity-80 cursor-not-allowed">
                                                <span className="font-bold text-sm mb-1 text-slate-700">Action Completed</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border ${
                                                    returnDetail.status?.toLowerCase() === 'refunded' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    returnDetail.status?.toLowerCase() === 'replaced' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    'bg-rose-100 text-rose-700 border-rose-200'
                                                }`}>
                                                    Final Status: {returnDetail.status}
                                                </span>
                                            </div>

                                            {/* UNDO / REOPEN BUTTON */}
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => handleAction('pending')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 font-bold transition-all text-xs shadow-sm disabled:opacity-50 cursor-pointer mt-2"
                                            >
                                                <FiRotateCcw size={14} /> Re-open Request
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SYSTEM LOG FOOTER */}
                    <div className="bg-white border border-slate-200/80 rounded-xl p-5 text-slate-600 text-sm flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <FiClock size={18} />
                        </div>
                        <p className="leading-relaxed">
                            <span className="font-bold text-slate-900">System Log:</span> RMA Record automatically generated on <span className="font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{returnDetail.created_at ? new Date(returnDetail.created_at).toLocaleString() : 'Date N/A'}</span>.
                        </p>
                    </div>

                </div>
            )}
        </div>
    );
};

export default RMAProcess;