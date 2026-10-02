import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiTag, FiSearch, FiPlus, FiMoreVertical, FiCalendar, FiAlertCircle, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert';
import api, { getCsrfCookie } from '../../utils/api'; 

const CouponManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dropdown state for 3 dots
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Secure Fetch Coupons from Laravel Backend
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      // Secure CSRF Cookie handshake for Laravel Sanctum
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }
      const response = await api.get('/api/v1/coupons');
      const rawData = response.data?.data || response.data;
      setCoupons(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      console.error("Asli Error Yeh Hai:", err.response || err);
      
      const serverErrorMessage = err.response?.data?.message || err.message;
      const statusCode = err.response?.status ? `(Error ${err.response.status})` : '';
      
      setError(`Failed to load: ${serverErrorMessage} ${statusCode}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Secure Delete Action with CSRF handshake
  const handleDelete = async (id) => {
    if (!id) return;
    setOpenDropdownId(null); 
    
    const willDelete = await swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this coupon!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (willDelete) {
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }
        await api.delete(`/api/v1/coupons/${id}`);
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        swal("Poof! Your coupon has been deleted!", { icon: "success" });
      } catch (err) {
        console.error("Delete Error:", err);
        swal("Error!", "Failed to delete the coupon.", "error");
      }
    }
  };

  // Null-safe performance-optimized search filtering
  const filteredCoupons = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return coupons;
    return coupons.filter(coupon => {
      const code = coupon.code ? String(coupon.code).toLowerCase() : '';
      return code.includes(query);
    });
  }, [coupons, searchTerm]);

  // Format date correctly
  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">

      {/* HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <FiTag className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Coupon Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Create and monitor discount codes for your customers.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FiSearch className="text-slate-400 text-sm" />
            </div>
            {/* FIX APPLIED: Mote focus ring ko hata kar clean border focus laga diya hai */}
            <input
              type="text"
              placeholder="Search by code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[42px] pl-9 pr-4 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:border-slate-900 focus:bg-white outline-none transition-all uppercase placeholder:normal-case"
            />
          </div>
          <button
            onClick={() => navigate('/admin/dashboard/coupons/create')} 
            className="h-[42px] px-5 bg-slate-900 text-white rounded-md text-sm font-bold flex items-center gap-2 hover:bg-slate-800 shadow-xs whitespace-nowrap cursor-pointer"
          >
            <FiPlus /> Create Coupon
          </button>
        </div>
      </div>

      {/* COUPONS TABLE */}
      <div className="w-full bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left">
            <thead className="bg-slate-50/75 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Coupon Code</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Discount</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Usage Stats</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Expiry Date</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                     <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Loading coupons...</span>
                     </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-rose-500 font-medium flex items-center justify-center gap-2">
                    <FiAlertCircle /> {error}
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-slate-900">{coupon.code}</td>
                    
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}% OFF` 
                        : `₹${coupon.discount_value} OFF`}
                    </td>
                    
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {coupon.used_count || 0} / {coupon.usage_limit ? coupon.usage_limit : '∞'}
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        coupon.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : coupon.status === 'Draft' 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        {coupon.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-2">
                      <FiCalendar size={14} className="text-slate-400" /> {formatDate(coupon.expiry_date)}
                    </td>
                    
                    {/* Action Dropdown Menu */}
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === coupon.id ? null : coupon.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        <FiMoreVertical size={18} />
                      </button>

                      {openDropdownId === coupon.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenDropdownId(null)}
                          ></div>
                          
                          <div className="absolute right-6 top-10 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                            <button 
                              onClick={() => {
                                navigate(`/admin/dashboard/coupons/edit/${coupon.id}`);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 cursor-pointer"
                            >
                              <FiEdit className="text-slate-400" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(coupon.id)}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                            >
                              <FiTrash2 className="text-rose-400" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CouponManagement;