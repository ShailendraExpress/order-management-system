import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiCreditCard, FiTruck, FiAlertCircle, 
  FiFilter, FiFileText, FiCheckCircle, FiClock, FiXCircle 
} from 'react-icons/fi';
import swal from 'sweetalert';

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from '../../utils/api';

const RevenueReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30days');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch Revenue Data Securely
  const fetchRevenueReports = async (selectedRange = range, customStart = startDate, customEnd = endDate) => {
    setLoading(true);
    try {
      // Ensure CSRF token is set before making the request
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      let url = `/api/v1/admin/revenue-reports?range=${selectedRange}`;
      if (selectedRange === 'custom' && customStart && customEnd) {
        url += `&start_date=${customStart}&end_date=${customEnd}`;
      }

      const response = await api.get(url);
      
      // Safely unwrap data to prevent undefined errors
      const responseData = response.data?.data || response.data || null;
      if (responseData) {
        setReport(responseData);
      }
    } catch (error) {
      console.error("Failed to load revenue reports", error);
      swal("Error", "Could not load revenue data from the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when standard ranges change
  useEffect(() => {
    if (range !== 'custom') {
      fetchRevenueReports(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Handle Custom Date Range Submission
  const handleCustomApply = () => {
    if (startDate && endDate) {
      fetchRevenueReports('custom', startDate, endDate);
    } else {
      swal("Notice", "Please select both Start Date and End Date.", "warning");
    }
  };

  // Utility: Format Date & Time gracefully
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
            <FiDollarSign className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Revenue Reports</h1>
            <p className="text-xs text-slate-500 mt-0.5">Analyze gross earnings, payment gateway splits, and cash collections.</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gross Revenue</p>
              <h3 className="text-xl font-black text-slate-900">₹ {formatCurrency(report?.gross_revenue)}</h3>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Total Valid Sales</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold shrink-0">
              ₹
            </div>
          </div>
        </div>

        {/* UPI Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">UPI / Digital</p>
              <h3 className="text-xl font-black text-slate-900">₹ {formatCurrency(report?.upi_revenue)}</h3>
              <span className="text-[10px] text-blue-600 font-semibold mt-1 inline-block">Online Payments</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
              <FiCreditCard />
            </div>
          </div>
        </div>

        {/* COD Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Cash on Delivery</p>
              <h3 className="text-xl font-black text-slate-900">₹ {formatCurrency(report?.cod_revenue)}</h3>
              <span className="text-[10px] text-indigo-600 font-semibold mt-1 inline-block">COD Orders Value</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
              <FiTruck />
            </div>
          </div>
        </div>

        {/* Pending Collections */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pending Unpaid</p>
              <h3 className="text-xl font-black text-slate-900">₹ {formatCurrency(report?.pending_collections)}</h3>
              <span className="text-[10px] text-amber-600 font-semibold mt-1 inline-block">Awaiting Clearance</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <FiAlertCircle />
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED REVENUE LEDGER TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden relative min-h-[300px]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FiFileText /> Transaction Revenue Ledger
          </h3>
          <span className="text-xs text-slate-500 font-medium">{report?.transactions?.length || 0} Records Found</span>
        </div>
        <div className="overflow-x-auto relative">
          
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 min-h-[200px]">
              <span className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
            </div>
          )}

          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Order Number</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5">Payment Status</th>
                <th className="px-6 py-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {report?.transactions?.length > 0 ? (
                report.transactions.map((tx, index) => {
                  
                  // Safe string conversions
                  const method = (tx.payment_method || '').toLowerCase();
                  const status = (tx.payment_status || '').toLowerCase();

                  return (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{tx.order_number}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{formatDateTime(tx.created_at)}</td>
                      
                      {/* E-COMMERCE STANDARD: PAYMENT METHOD BADGES */}
                      <td className="px-6 py-4">
                        {method === 'cod' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <FiTruck size={12} /> {tx.payment_method}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            <FiCreditCard size={12} /> {tx.payment_method || 'Online'}
                          </span>
                        )}
                      </td>
                      
                      {/* E-COMMERCE STANDARD: PAYMENT STATUS BADGES */}
                      <td className="px-6 py-4">
                        {['success', 'paid', 'completed'].includes(status) ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FiCheckCircle size={12} /> {tx.payment_status}
                          </span>
                        ) : ['failed', 'cancelled', 'refunded'].includes(status) ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            <FiXCircle size={12} /> {tx.payment_status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            <FiClock size={12} /> {tx.payment_status || 'Pending'}
                          </span>
                        )}
                      </td>

                      {/* E-COMMERCE STANDARD: AMOUNT COLOR CODING */}
                      <td className={`px-6 py-4 text-right font-bold font-mono ${
                        ['unpaid', 'pending', 'failed', 'cancelled'].includes(status) ? 'text-slate-500' : 'text-emerald-600'
                      }`}>
                        ₹ {formatCurrency(tx.total_price)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-500 text-xs font-medium">
                    {loading ? "Fetching transaction ledger..." : "No financial transaction records found for this period."}
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

export default RevenueReports;