import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, 
  FiShield, FiTag, FiCheckCircle, FiXCircle, FiShoppingBag, FiEdit3, FiAlertCircle 
} from "react-icons/fi";
import { HiChevronDoubleLeft } from "react-icons/hi";
import swal from "sweetalert";

// Import the secure API instance and CSRF helper function
import api, { getCsrfCookie } from "../../utils/api";

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State management for customer data and loading status
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setLoading(true);
      try {
        // Secure CSRF Cookie handshake for Laravel Sanctum authentication
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        // Fetch customer details using the globally configured API instance
        const response = await api.get(`/api/v1/customers/${id}`);
        
        if (response.data.status || response.data.success) {
          setCustomer(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        // Show an error alert if the API call fails
        swal("Error", "Could not load customer profile.", "error");
      } finally {
        // Ensure loading is stopped regardless of success or failure
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [id]);

  // Helper function for dynamic Group Badge styling (VIP gets special gold styling)
  const getGroupBadgeStyle = (group) => {
    switch (group?.toLowerCase()) {
      case 'vip':
        return 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-2xs';
      case 'wholesale':
      case 'b2b':
        return 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200 font-medium';
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* PAGE HEADER - Remains sticky at the top, preventing a blank screen on scroll */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
            <FiUser className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {loading ? "Loading Profile..." : customer?.name || "Customer Profile"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Customer Account Details & Overview</p>
          </div>
        </div>

        {/* Action Buttons: Back and Edit Profile */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center h-[42px] px-4 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
          >
            <HiChevronDoubleLeft className="mr-1.5" /> Back
          </button>
          
          {!loading && customer && (
            <button
              onClick={() => navigate(`/admin/dashboard/customers/edit/${customer.id}`)}
              className="inline-flex items-center justify-center gap-2 h-[42px] px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <FiEdit3 /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* CONTENT AREA: Handles Loading, Not Found, and Success states */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-20 text-center shadow-xs">
          <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mr-2 align-middle"></div>
          <span className="text-sm font-semibold text-slate-500">Loading customer profile details...</span>
        </div>
      ) : !customer ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-20 text-center shadow-xs">
          <p className="text-base font-bold text-slate-800">Customer not found!</p>
          <p className="text-xs text-slate-500 mt-1">The requested profile might have been deleted or does not exist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2 COLUMNS: PERSONAL & ADDRESS INFORMATION */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PERSONAL INFORMATION CARD */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                <FiShield className="text-slate-500" /> Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</p>
                  <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</p>
                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FiMail className="text-slate-400" /> {customer.email}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-2 font-mono">
                    <FiPhone className="text-slate-400" /> {customer.phone || 'Not Provided'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gender & DOB</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {customer.gender || 'N/A'} • {customer.dob ? new Date(customer.dob).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* DEFAULT SHIPPING ADDRESS CARD */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                <FiMapPin className="text-slate-500" /> Default Shipping Address
              </h2>
              
              {customer.address_line1 ? (
                <div className="space-y-1.5 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{customer.address_line1}</p>
                  {customer.address_line2 && <p>{customer.address_line2}</p>}
                  <p>{customer.city}, {customer.state} - <span className="font-mono font-bold">{customer.pincode}</span></p>
                  <p className="text-slate-500 font-medium text-xs pt-1">{customer.country}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No address added yet.</p>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ACCOUNT STATUS, VIP BADGE & ORDER SUMMARY */}
          <div className="space-y-6">
            
            {/* ACCOUNT OVERVIEW & STATUS CARD */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5">
                Account Overview
              </h2>

              <div className="space-y-4">
                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Status</span>
                  {Number(customer.is_active) === 1 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FiCheckCircle size={12} /> Active
                    </span>
                  ) : Number(customer.is_active) === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                      <FiXCircle size={12} /> Suspended / Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      <FiAlertCircle size={12} /> Inactive
                    </span>
                  )}
                </div>

                {/* Customer Group Badge (Highlights VIP status automatically) */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Customer Group</span>
                  <span className={`text-[10px] uppercase px-3 py-1 rounded-md tracking-wider ${getGroupBadgeStyle(customer.customer_group)}`}>
                    {customer.customer_group || 'Regular'}
                  </span>
                </div>

                {/* Verification Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Email Verification</span>
                  <span className={`text-xs font-semibold ${customer.email_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {customer.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>

                {/* Marketing Preferences */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Marketing Opt-in</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {customer.newsletter ? 'Subscribed' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* ORDER HISTORY SUMMARY CARD */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                <FiShoppingBag className="text-slate-500" /> Orders History
              </h2>
              
              <div className="text-center py-4">
                <p className="text-2xl font-black text-slate-900">{customer.orders?.length || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total orders placed by customer</p>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default CustomerDetails;