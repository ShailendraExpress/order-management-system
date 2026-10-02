import React, { useState, useMemo, useEffect } from "react";
import { FiSearch, FiTruck, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { useNavigate } from "react-router-dom"; 

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from "../../utils/api"; 

const Orders = () => {
  const [orders, setOrders] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); 

  // Fetch orders securely on component load
  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        // Secure CSRF Cookie handshake for Laravel Sanctum
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        // Fetch orders using the global secure API instance
        const response = await api.get('/api/v1/orders');

        if (isMounted && response.data) {
          const fetchedOrders = response.data.data || response.data;
          setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load orders from server.");
        }
      } finally {
        if (isMounted) {
          setLoading(false); 
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []); 

  // Filter orders by status tab and search term
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const customerName = o.customer?.name || "Unknown Customer";
      const orderId = o.order_number || o.id?.toString() || "";

      const matchesFilter = filter === "All" || o.status?.toLowerCase() === filter.toLowerCase();
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            orderId.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, searchTerm]);

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER CARD - ALWAYS VISIBLE */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <AiOutlineShoppingCart className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Order Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Track, fulfill, and manage customer orders.</p>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          {["All", "Pending", "Processing", "Delivered", "Cancelled"].map(tab => (
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
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3.5 top-3.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search Order ID / Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[42px] pl-9 pr-4 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm font-medium">
          Error: {error}
        </div>
      )}

      {/* CONTENT AREA: INLINE SPINNER WHILE LOADING, ELSE SHOWS TABLE */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-20 text-center shadow-xs">
          <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mr-2 align-middle"></div>
          <span className="text-sm font-semibold text-slate-500">Loading orders...</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 text-sm">
                      <td className="px-6 py-4 font-bold font-mono text-slate-900">{order.order_number || `ORD-${order.id}`}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{order.customer?.name || "Unknown"}</td>
                      <td className="px-6 py-4 font-mono">₹{Number(order.total_price || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500">{order.created_at ? order.created_at.split('T')[0] : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                          order.status?.toLowerCase() === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                          order.status?.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700' :
                          order.status?.toLowerCase() === 'cancelled' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {order.status?.toLowerCase() === 'delivered' ? <FiCheckCircle/> : 
                           order.status?.toLowerCase() === 'cancelled' ? <FiXCircle/> :
                           order.status?.toLowerCase() === 'pending' ? <FiClock/> : <FiTruck/>}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          type="button"
                          onClick={() => navigate(`/admin/dashboard/orders/${order.id}`)} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-[11px] font-bold uppercase transition-all shadow-2xs cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-slate-500 text-xs font-medium">
                      {error ? "Could not fetch orders due to a server error." : "No orders found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;