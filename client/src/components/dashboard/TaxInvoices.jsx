import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiFileText, FiSearch, FiDownloadCloud, FiEye, 
  FiFilter, FiX, FiCheckCircle, FiUser, FiCalendar, FiInfo
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from '../../utils/api';

const TaxInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Securely Fetch Invoices
  const fetchInvoices = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    
    try {
      // Ensure CSRF token is set before making the request
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      // Real API Call
      const response = await api.get('/api/v1/admin/invoices');
      
      if (isMounted) {
        // Safely unwrap data to prevent undefined errors
        const responseData = response.data?.data || response.data;
        setInvoices(Array.isArray(responseData) ? responseData : []);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      if (isMounted) {
        toast.error("Failed to load tax invoices from the server.");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handle PDF Download
  const handleDownload = (invoiceNo) => {
    toast.success(`Downloading PDF for ${invoiceNo}...`, { icon: '📄' });
    // Note: If this endpoint is protected by Sanctum, opening in a new tab works 
    // as long as the session cookie is valid in the browser.
    window.open(`http://localhost:8000/api/v1/admin/invoices/${invoiceNo}/download`, '_blank');
  };

  // Open View Modal
  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  // Filter Logic
  const filteredInvoices = invoices.filter(inv => {
    const invNo = inv.invoice_no || '';
    const orderId = inv.order_id || '';
    const customer = inv.customer || '';
    const status = inv.status || '';

    const matchesSearch = 
      invNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
      orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Utility: Format Currency gracefully
  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Standardized Status Badge Styling
  const getStatusBadge = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    switch(normalizedStatus) {
      case 'paid': 
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'pending': 
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'refunded': 
      case 'failed':
      case 'cancelled':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      default: 
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs shrink-0">
            <FiFileText className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Tax Invoices</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage, search, and download generated GST invoices for orders.</p>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search invoice, order, name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36 pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden relative min-h-[300px] flex flex-col animate-fade-in">
        
        {/* Safe Loader Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
            <span className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
            <span className="text-sm font-semibold text-slate-600">Loading Invoices...</span>
          </div>
        )}

        {/* FIX: overflow-y-hidden strictly prevents ghost vertical scrollbars */}
        <div className="overflow-x-auto overflow-y-hidden w-full flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Invoice & Order ID</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Date Issued</th>
                <th className="px-6 py-4">Amount (Incl. Tax)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id || inv.invoice_no} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <div 
                          className="font-bold text-indigo-700 text-[13px] hover:underline cursor-pointer" 
                          onClick={() => handleView(inv)}
                        >
                          {inv.invoice_no || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">Order: {inv.order_id || 'N/A'}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900 text-[13px] truncate" title={inv.customer}>{inv.customer || 'Guest'}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate" title={inv.email}>{inv.email || 'N/A'}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-slate-700 font-medium">
                        {inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900 text-[13px] font-mono">₹{formatCurrency(inv.amount)}</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5 font-mono">Tax: ₹{formatCurrency(inv.tax)}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(inv.status)}`}>
                        {inv.status || 'Pending'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-slate-400">
                        {/* Download PDF Button */}
                        <button 
                          type="button"
                          onClick={() => handleDownload(inv.invoice_no)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md transition-all cursor-pointer font-semibold text-xs shadow-sm active:scale-95"
                          title="Download PDF"
                        >
                          <FiDownloadCloud size={14} /> Download
                        </button>

                        {/* View Button */}
                        <button 
                          type="button"
                          onClick={() => handleView(inv)}
                          className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                          title="View Invoice Details"
                        >
                          <FiEye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center">
                        {loading ? <span className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span> : <FiInfo size={28} />}
                      </div>
                      <p className="text-slate-500 text-sm font-medium">
                        {loading ? "Fetching invoices..." : "No invoices found matching your criteria."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW INVOICE MODAL */}
      {/* ========================================================================= */}
      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 my-auto animate-fade-in flex flex-col max-h-full">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FiFileText className="text-indigo-600" /> Invoice Details
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsViewModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto">
              
              {/* Top Section: Invoice Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{selectedInvoice.invoice_no || 'N/A'}</div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-1.5">
                    <FiCalendar size={14} className="text-slate-400" /> 
                    {selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className={`inline-block px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(selectedInvoice.status)}`}>
                    {selectedInvoice.status || 'Pending'}
                  </span>
                  <div className="text-xs font-semibold text-slate-500 mt-2.5">
                    Order ID: <span className="text-slate-800 font-mono">{selectedInvoice.order_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Customer Info */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-8">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FiUser size={14} /> Billed To
                </h4>
                <div className="font-bold text-slate-900 text-base">{selectedInvoice.customer || 'Guest'}</div>
                <div className="text-sm font-medium text-slate-600 mt-0.5">{selectedInvoice.email || 'N/A'}</div>
              </div>

              {/* Bottom Section: Amount Summary */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Payment Summary</h4>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">Subtotal (before tax)</span>
                    <span className="font-bold text-slate-800 font-mono">
                      ₹{formatCurrency(Number(selectedInvoice.amount || 0) - Number(selectedInvoice.tax || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">Tax Amount</span>
                    <span className="font-bold text-slate-800 font-mono">₹{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                  <hr className="border-slate-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-slate-900">Total Amount</span>
                    <span className="text-xl font-black text-indigo-700 font-mono">₹{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button 
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold cursor-pointer transition-all active:scale-95"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={() => {
                  handleDownload(selectedInvoice.invoice_no);
                  setIsViewModalOpen(false);
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold cursor-pointer shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <FiDownloadCloud size={16} /> Download PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TaxInvoices;