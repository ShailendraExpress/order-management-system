import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBox, FiChevronRight, FiClock, FiCheckCircle, FiXCircle, FiTruck } from "react-icons/fi";
import axios from "axios";

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token'); 

        if (!token) {
            navigate('/login');
            return;
        }

        const response = await axios.get('http://127.0.0.1:8000/api/my-orders', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [navigate]);

  return (
    <div className="bg-slate-50 min-h-screen py-8 font-sans text-slate-800">
      {/* AAPKI CUSTOM WIDTH CLASSES YAHAN HAIN */}
      <div className="max-w-[1500px] w-[95vw] lg:w-[90vw] mx-auto">
        
        {/* ========================================== */}
        {/* BREADCRUMB NAVIGATION YAHAN ADD KIYA HAI   */}
        {/* ========================================== */}
        <nav className="flex items-center text-sm text-slate-500 mb-6 font-medium">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <FiChevronRight className="mx-2 text-slate-400" />
          <span className="text-slate-900 font-bold">My Orders</span>
        </nav>

        {/* Header - Agar orders hain tabhi dikhayenge */}
        {orders.length > 0 && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <FiBox className="text-blue-600" /> My Orders
              </h1>
              <p className="text-sm text-slate-500 mt-1">View and track all your recent purchases.</p>
            </div>
        )}

        {/* Orders List / Empty State */}
        {loading ? (
          <div className="text-center py-20 font-medium text-slate-500">Loading your orders...</div>
        ) : orders.length === 0 ? (
            
          // EMPTY DESIGN
          <div className="bg-white rounded-2xl py-24 px-10 text-center border border-slate-200 shadow-sm mt-4">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 text-5xl">
              <FiBox />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">No orders yet</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
              Looks like you haven't made your first purchase.<br />
              Discover our latest products and start shopping!
            </p>
            <Link to="/products" className="inline-block px-10 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm">
              Start Shopping
            </Link>
          </div>

        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Order Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-900">{order.order_number || `ORD-${order.id}`}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status === 'delivered' ? <FiCheckCircle/> : 
                       order.status === 'cancelled' ? <FiXCircle/> :
                       order.status === 'pending' ? <FiClock/> : <FiTruck/>}
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Placed on: {order.created_at ? order.created_at.split('T')[0] : 'N/A'} • {order.items?.length || 0} Items
                  </p>
                </div>

                {/* Amount & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">Total</p>
                    <p className="font-bold text-slate-900">₹{Number(order.total_price).toLocaleString()}</p>
                  </div>
                  <Link 
                    to={`/my-orders/${order.id}`} 
                    className="flex items-center gap-1 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-sm rounded-lg transition-colors"
                  >
                    Details <FiChevronRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;