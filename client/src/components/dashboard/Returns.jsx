import React, { useState, useMemo, useEffect, useCallback } from "react";
import { FiSearch, FiRotateCcw, FiAlertCircle, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { MdOutlineKeyboardReturn } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import swal from "sweetalert";

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from "../../utils/api";

const Returns = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All"); 
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Returns Data securely from the backend API on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchReturns = async () => {
      setLoading(true);
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        const response = await api.get("/api/v1/admin/returns");

        if (isMounted && response.data) {
          const responseData = response.data.data || response.data;
          setReturns(Array.isArray(responseData) ? responseData : []);
        }
      } catch (error) {
        console.error("Error fetching returns:", error);
        if (isMounted) {
          swal("Error", "Failed to load return requests.", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReturns();

    return () => {
      isMounted = false;
    };
  }, []);

  // Optimized filter functionality (combining status tabs and search query)
  const filteredReturns = useMemo(() => {
    return returns.filter(r => {
      const rmaId = `RMA-${r.id || ''}`;
      const customerName = r.customer?.name || "";
      const status = r.status || "";
      
      const matchesFilter = filter === "All" || status.toLowerCase() === filter.toLowerCase();
      const matchesSearch = rmaId.toLowerCase().includes(searchTerm.toLowerCase().trim()) || 
                            customerName.toLowerCase().includes(searchTerm.toLowerCase().trim());
      
      return matchesFilter && matchesSearch;
    });
  }, [searchTerm, returns, filter]);

  // Handle search query change
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <MdOutlineKeyboardReturn className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Returns & RMA</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage reverse logistics, QC, and refund workflows.</p>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          {["All", "Pending", "Approved", "Rejected"].map(tab => (
            <button 
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === tab ? "bg-slate-900 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search RMA ID or Customer Name..." 
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full h-[42px] pl-10 pr-4 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>
      </div>

      {/* RETURNS TABLE SECTION */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mr-2 align-middle"></div>
            <span className="text-sm font-semibold text-slate-500">Loading RMA requests...</span>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs font-medium">
            No return requests found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-6 py-4">RMA ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredReturns.map(ret => (
                  <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold font-mono text-slate-900">RMA-{ret.id}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{ret.customer?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500 italic truncate max-w-[200px]" title={ret.reason}>{ret.reason}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 capitalize text-xs">{ret.action || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                        ret.status?.toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        ret.status?.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ret.status?.toLowerCase() === 'approved' ? <FiCheckCircle size={12}/> : 
                         ret.status?.toLowerCase() === 'rejected' ? <FiAlertCircle size={12}/> : <FiRotateCcw size={12}/>}
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        type="button"
                        onClick={() => navigate(`/admin/dashboard/returns/${ret.id}`)} 
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-all cursor-pointer"
                      >
                        Process <FiArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Returns;