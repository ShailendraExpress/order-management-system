import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import { 
  FiShoppingBag, FiTrendingUp, FiClock, FiCreditCard as FiCreditCardIcon, 
  FiSearch, FiFilter, FiDownload, FiInfo 
} from 'react-icons/fi';
import { FaChevronRight } from 'react-icons/fa';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import swal from 'sweetalert';
import { useNavigate, Link } from 'react-router-dom';

// Import secure global API instance, CSRF helper, and formatter
import api, { getCsrfCookie } from '../../utils/api'; 
import { formatPrice } from '../../utils/helpers'; 

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 8;

  // Securely Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    
    try {
      // Ensure CSRF token is set before making the request
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      // Recommend updating to /api/v1/admin/transactions if applicable for your routing
      const response = await api.get('/api/v1/transactions'); 
      
      if (isMounted) {
        // Safely unwrap data to prevent undefined crashes
        const responseData = response.data?.data || response.data;
        setTransactions(Array.isArray(responseData) ? responseData : []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (isMounted) {
        swal("Error", "Could not load transaction data from the server.", "error");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => { 
    fetchTransactions(); 
  }, [fetchTransactions]);

  // Safe Filtering Logic
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const orderId = t.orderId || '';
      const amountStr = t.amount?.toString() || '';
      const customer = t.customer || '';
      const status = t.status || '';

      const matchesSearch = 
        orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        amountStr.includes(searchTerm) ||
        customer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  // Pagination Logic
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(itemOffset, itemOffset + itemsPerPage);

  const handlePageClick = (e) => {
    const newOffset = (e.selected * itemsPerPage) % filteredData.length;
    setItemOffset(newOffset);
  };

  // Secure CSV Export (Escaping commas to prevent corrupted columns)
  const exportCSV = () => {
    if (filteredData.length === 0) {
      swal("Notice", "No data available to export.", "warning");
      return;
    }

    const headers = ["Transaction ID", "Order ID", "Customer", "Amount", "Status", "Date"];
    
    const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const rows = filteredData.map(t => 
      [t.id, t.orderId, t.customer, t.amount, t.status, t.date].map(escapeCSV).join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Transactions_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Standardized Status Badge Styling
  const getStatusBadge = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    if (['success', 'paid'].includes(normalizedStatus)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (['pending', 'unpaid'].includes(normalizedStatus)) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (['failed', 'refunded', 'cancelled'].includes(normalizedStatus)) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans text-slate-800 flex-1 w-full animate-fade-in">
      
      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "TOTAL TRANSACTIONS", val: transactions.length, icon: <FiShoppingBag className="text-purple-600" /> },
          { label: "TOTAL REVENUE", val: formatPrice(transactions.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0)), icon: <FiTrendingUp className="text-emerald-600" /> },
          { label: "PENDING PAYMENTS", val: transactions.filter(t => (t.status || '').toLowerCase() !== 'success').length, icon: <FiClock className="text-amber-600" /> }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
              <h2 className="text-2xl font-black text-slate-900">{item.val}</h2>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${
              i === 0 ? 'bg-purple-50' : i === 1 ? 'bg-emerald-50' : 'bg-amber-50'
            }`}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 2. HEADER & FILTERS */}
      <div className="bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-xs mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <FiCreditCardIcon size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Transaction History</h1>
            <p className="text-xs text-slate-500 mt-0.5">Track and manage all payment logs.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" 
              placeholder="Search ID, Amount..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setItemOffset(0); }} 
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              className="w-full sm:w-36 pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all appearance-none" 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setItemOffset(0); }}
            >
              <option value="All">All Status</option>
              <option value="success">Success</option>
              <option value="unpaid">Unpaid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button 
            onClick={exportCSV} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 3. TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden relative flex flex-col min-h-[350px]">
        
        {/* Safe Overlay Loader */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
            <span className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
            <span className="text-sm font-semibold text-slate-600">Loading transactions...</span>
          </div>
        )}

        {/* FIX: overflow-y-hidden applied to prevent vertical ghost scrollbar */}
        <div className="overflow-x-auto overflow-y-hidden w-full flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {!loading && currentItems.length > 0 ? (
                currentItems.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[13px] text-slate-900">{txn.id && txn.id !== 'N/A' ? txn.id : 'No Txn ID'}</p>
                      <p className="text-xs text-indigo-600 font-medium mt-0.5 hover:underline cursor-pointer">Order: {txn.orderId || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold uppercase text-slate-600 tracking-wide">
                      {txn.method || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-black text-[13px] text-slate-900 font-mono">
                      {formatPrice(txn.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {txn.date || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(txn.status)}`}>
                         {txn.status || 'Unknown'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                          to={`/admin/dashboard/payments/transactions/${txn.orderId || txn.id}`} 
                          className="inline-flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                          title="View Transaction Details"
                      >
                          <FaChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center">
                        <FiInfo size={28} />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">No transactions found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION */}
        {!loading && filteredData.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="text-xs font-medium text-slate-500">
              Showing <span className="font-bold text-slate-700">{currentItems.length}</span> of <span className="font-bold text-slate-700">{filteredData.length}</span> transactions
            </div>
            <ReactPaginate
              onPageChange={handlePageClick}
              pageCount={pageCount}
              forcePage={itemOffset / itemsPerPage}
              containerClassName={"flex items-center gap-1.5"}
              pageClassName={"flex items-center justify-center"}
              pageLinkClassName={"w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"}
              activeLinkClassName={"!bg-slate-900 !border-slate-900 !text-white"}
              previousClassName={"flex items-center justify-center mr-1"}
              nextClassName={"flex items-center justify-center ml-1"}
              previousLinkClassName={"w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"}
              nextLinkClassName={"w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"}
              disabledLinkClassName={"opacity-50 cursor-not-allowed hover:bg-white"}
              previousLabel={<ArrowBackIosIcon style={{fontSize: 12}} />}
              nextLabel={<ArrowForwardIosIcon style={{fontSize: 12}} />}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;