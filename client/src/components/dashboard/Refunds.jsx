import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import { FaChevronRight } from 'react-icons/fa';
import { FiShoppingBag, FiTrendingUp, FiClock, FiRepeat, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import swal from 'sweetalert';
import { useNavigate, Link } from 'react-router-dom';

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from '../../utils/api'; 
import { formatPrice } from '../../utils/helpers'; 

const Refunds = () => {
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 8;

  // Fetch refunds data securely from the backend API
 const fetchRefunds = async () => {
    setLoading(true);
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      // ✅ FIX: Sahi v1 route path use karein (jaise baaki components me hai)
      const response = await api.get('/api/admin/refunds'); 
      
      const responseData = response.data?.data || response.data;
      setRefunds(Array.isArray(responseData) ? responseData : []);
    } catch (error) {
      console.error("Error fetching refunds:", error);
      swal("Error", "Could not load refund data from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchRefunds(); 
  }, []);

  // Filter refunds based on search query and status filter
  const filteredData = useMemo(() => {
    return refunds.filter(r => {
      const orderId = r.orderId || '';
      const amount = r.amount?.toString() || '';
      const customer = r.customer || '';
      const status = r.status || '';

      const matchesSearch = orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            amount.includes(searchTerm) ||
                            customer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [refunds, searchTerm, statusFilter]);

  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(itemOffset, itemOffset + itemsPerPage);

  const handlePageClick = useCallback((e) => {
    setItemOffset((e.selected * itemsPerPage) % filteredData.length);
  }, [filteredData.length]);

  // Export filtered data to a CSV file
  const exportCSV = useCallback(() => {
    if (filteredData.length === 0) {
      swal("Notice", "No data available to export.", "info");
      return;
    }

    const headers = ["Refund ID,Order ID,Customer,Amount,Status,Date"];
    const rows = filteredData.map(r => `${r.id || ''},${r.orderId || ''},"${r.customer || ''}",${r.amount || 0},${r.status || ''},${r.date || ''}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "refunds_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredData]);

  // Compute stats safely
  const totalRefundsCount = refunds.length;
  const totalAmountRefunded = refunds.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const pendingRefundsCount = refunds.filter(r => (r.status || '').toLowerCase() === 'pending').length;

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: "TOTAL REFUNDS", val: totalRefundsCount, icon: <FiShoppingBag className="text-purple-600" /> },
          { label: "TOTAL AMOUNT REFUNDED", val: formatPrice ? formatPrice(totalAmountRefunded) : `₹${totalAmountRefunded.toLocaleString()}`, icon: <FiTrendingUp className="text-emerald-600" /> },
          { label: "PENDING REFUNDS", val: pendingRefundsCount, icon: <FiClock className="text-amber-600" /> }
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/85 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl">{item.icon}</div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{item.val}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* 2. HEADER & FILTERS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/85 shadow-xs mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full lg:w-auto">
          <div className="w-11 h-11 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-2xs shrink-0">
            <FiRepeat size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Refund History</h1>
            <p className="text-xs text-slate-500 mt-0.5">Track and manage all customer refunds seamlessly.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-900 focus:bg-white transition-all" 
              placeholder="Search ID, Amount..." 
              onChange={(e) => { setSearchTerm(e.target.value); setItemOffset(0); }} 
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="w-full sm:w-auto pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer focus:border-slate-900 focus:bg-white transition-all" 
              onChange={(e) => { setStatusFilter(e.target.value); setItemOffset(0); }}
            >
              <option value="All">All Status</option>
              <option value="processed">Processed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <button 
            type="button"
            onClick={exportCSV} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer shrink-0"
          >
            <FiDownload size={16} /> Export
          </button>
        </div>
      </div>

      {/* 3. TABLE SECTION */}
      <div className="bg-white border border-slate-200/85 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Refund Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Loading refunds...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((r) => (
                  <tr key={r.id || r.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-[13px]">{r.id !== 'N/A' ? r.id : 'No Refund ID'}</p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{r.orderId}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-slate-700">{r.customer}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                      {formatPrice ? formatPrice(r.amount) : `₹${Number(r.amount || 0).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                        r.status?.toLowerCase() === 'processed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        r.status?.toLowerCase() === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/admin/dashboard/orders/${r.orderId}`} 
                        className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg text-slate-600 transition-all shadow-2xs cursor-pointer ml-auto"
                        title="View Order Details"
                      >
                        <FaChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500 text-xs font-medium">
                    No refunds found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION SECTION */}
        {!loading && filteredData.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200/85 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{itemOffset + 1}</span> to <span className="font-bold text-slate-800">{Math.min(itemOffset + itemsPerPage, filteredData.length)}</span> of <span className="font-bold text-slate-800">{filteredData.length}</span> results
            </div>
            {pageCount > 1 && (
              <ReactPaginate
                onPageChange={handlePageClick}
                pageCount={pageCount}
                pageRangeDisplayed={3}
                marginPagesDisplayed={1}
                containerClassName={"flex items-center space-x-1"}
                previousLabel={<ArrowBackIosIcon style={{fontSize: 10}} />}
                previousClassName={"flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer shadow-2xs"}
                previousLinkClassName={"w-full h-full flex items-center justify-center outline-none"}
                nextLabel={<ArrowForwardIosIcon style={{fontSize: 10}} />}
                nextClassName={"flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer shadow-2xs"}
                nextLinkClassName={"w-full h-full flex items-center justify-center outline-none"}
                pageClassName={"flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer shadow-2xs"}
                pageLinkClassName={"w-full h-full flex items-center justify-center outline-none"}
                activeClassName={"!bg-slate-900 !border-slate-900 !text-white font-bold shadow-xs"}
                breakLabel={'...'}
                breakClassName={"flex items-center justify-center w-8 h-8 text-slate-400 text-xs"}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Refunds;