import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiCalendar, FiFilter } from 'react-icons/fi';
import swal from 'sweetalert';

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from '../../utils/api';

const SalesAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30days');

    // Custom date range states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Fetch Analytics Data Securely
    const fetchAnalytics = async (selectedRange = range, customStart = startDate, customEnd = endDate) => {
        setLoading(true);
        try {
            // Ensure CSRF token is set before making the request
            if (typeof getCsrfCookie === 'function') {
                await getCsrfCookie();
            }

            let url = `/api/v1/admin/sales-analytics?range=${selectedRange}`;
            
            // Append custom dates if applicable
            if (selectedRange === 'custom' && customStart && customEnd) {
                url += `&start_date=${customStart}&end_date=${customEnd}`;
            }

            const response = await api.get(url);
            
            // Safely unwrap data to prevent undefined errors
            const responseData = response.data?.data || response.data || null;
            if (responseData) {
                setAnalytics(responseData);
            }
        } catch (error) {
            console.error("Failed to load analytics", error);
            swal("Error", "Could not load sales analytics from the server.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when standard ranges change
    useEffect(() => {
        if (range !== 'custom') {
            fetchAnalytics(range);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    // Handle Custom Date Range Submission with professional validation
    const handleCustomApply = () => {
        if (startDate && endDate) {
            fetchAnalytics('custom', startDate, endDate);
        } else {
            swal("Notice", "Please select both Start Date and End Date.", "warning");
        }
    };

    // Utility: Format numbers to Indian Rupee standard with commas
    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN');
    };

    return (
        <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">

            {/* HEADER & FILTER */}
            <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs shrink-0">
                        <FiTrendingUp className="text-xl" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sales Analytics</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Monitor revenue trends, order volumes, and business growth.</p>
                    </div>
                </div>

                {/* Range Filter Buttons & Custom Inputs */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        {['today', '7days', '30days', 'this_year', 'custom'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer uppercase ${
                                    range === r ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                            >
                                {r === '7days' ? 'Last 7 Days' : r === '30days' ? 'Last 30 Days' : r === 'this_year' ? 'This Year' : r === 'custom' ? 'Custom' : 'Today'}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Inputs (Visible only when 'custom' is selected) */}
                    {range === 'custom' && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-2xs animate-fade-in">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all cursor-pointer"
                            />
                            <span className="text-xs font-medium text-slate-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all cursor-pointer"
                            />
                            <button
                                onClick={handleCustomApply}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                                <FiFilter size={12} /> Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* Card 1: Total Revenue */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex items-center justify-between relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Revenue</p>
                        <h3 className="text-2xl font-black text-slate-900">₹ {formatCurrency(analytics?.total_revenue)}</h3>
                        <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Verified Earnings</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                        <FiDollarSign />
                    </div>
                </div>

                {/* Card 2: Total Orders */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex items-center justify-between relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Orders</p>
                        <h3 className="text-2xl font-black text-slate-900">{formatCurrency(analytics?.total_orders)}</h3>
                        <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Successful Checkouts</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                        <FiShoppingBag />
                    </div>
                </div>

                {/* Card 3: Average Order Value */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex items-center justify-between relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Avg. Order Value (AOV)</p>
                        <h3 className="text-2xl font-black text-slate-900">₹ {formatCurrency(analytics?.average_order_value)}</h3>
                        <span className="text-[11px] text-indigo-600 font-semibold mt-1 inline-block">Per Customer Basket</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                        <FiCalendar />
                    </div>
                </div>

            </div>

            {/* SALES TREND TABLE BREAKDOWN */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden relative flex flex-col min-h-[300px]">
                
                {/* Table Header Area */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Daily Performance Breakdown</h3>
                </div>
                
                {/* Safe Loader Overlay - Positioned securely to prevent scrollbars */}
                {loading && (
                    <div className="absolute inset-x-0 bottom-0 top-[53px] bg-white/70 backdrop-blur-sm flex items-center justify-center z-20">
                        <span className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
                    </div>
                )}

                {/* FIX: overflow-y-hidden perfectly eliminates the unwanted vertical ghost scrollbar */}
                <div className="overflow-x-auto overflow-y-hidden w-full flex-1">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3.5">Date</th>
                                <th className="px-6 py-3.5 text-center">Orders Count</th>
                                <th className="px-6 py-3.5 text-right">Revenue Generated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {analytics?.sales_trend?.length > 0 ? (
                                analytics.sales_trend.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-900">{item.date}</td>
                                        <td className="px-6 py-4 text-center font-medium text-slate-600">
                                            {formatCurrency(item.orders_count)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600 font-mono">
                                            ₹ {formatCurrency(item.revenue)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-20 text-center text-slate-500 text-xs font-medium">
                                        {loading ? "Fetching sales data..." : "No sales data found for this period."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default SalesAnalytics;