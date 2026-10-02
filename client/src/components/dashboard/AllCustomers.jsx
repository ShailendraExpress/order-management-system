import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import { FiSearch, FiUser, FiChevronRight, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert';
import api, { getCsrfCookie } from '../../utils/api';

const AllCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination States
  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 8;

  // ==========================================
  // 1. SECURE FETCH CUSTOMERS FROM LARAVEL API
  // ==========================================
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // Secure CSRF Cookie handshake for Sanctum protection
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }
      const response = await api.get('/api/v1/customers');
      if (response.data?.status || response.data?.success) {
        setCustomers(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch customers securely:", error);
      swal("Error", "Could not load customer data.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Return rounded rectangle badge styles for customer groups
  const getGroupBadgeStyle = (group) => {
    switch (group?.toLowerCase()) {
      case 'vip':
        return 'bg-amber-100 text-amber-800 border border-amber-300 font-bold shadow-2xs rounded-md';
      case 'wholesale':
      case 'b2b':
        return 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-md';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200 font-medium rounded-md';
    }
  };

  // ==========================================
  // 2. SECURE DELETE CUSTOMER LOGIC
  // ==========================================
  const handleDelete = async (id, name) => {
    if (!id) return;
    
    const willDelete = await swal({
      title: "Delete Customer?",
      text: `Are you sure you want to remove ${name || 'this'}'s account? This action cannot be undone.`,
      icon: "warning",
      buttons: ["Cancel", "Yes, delete it"],
      dangerMode: true,
    });

    if (willDelete) {
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }
        const response = await api.delete(`/api/v1/customers/${id}`);
        if (response.data?.status || response.data?.success) {
          swal("Deleted!", "Customer profile has been removed.", "success");
          fetchCustomers(); // Refresh the list securely
        }
      } catch (error) {
        console.error("Deletion error:", error);
        const errorMsg = error.response?.data?.message || "Could not delete customer securely.";
        swal("Action Failed", errorMsg, "error");
      }
    }
  };

  // ==========================================
  // 3. SECURE SEARCH & PAGINATION LOGIC
  // ==========================================
  const filteredCustomers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return customers.filter(c => {
      const nameMatch = c.name ? String(c.name).toLowerCase().includes(query) : false;
      const emailMatch = c.email ? String(c.email).toLowerCase().includes(query) : false;
      const phoneMatch = c.phone ? String(c.phone).includes(query) : false;
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [customers, searchTerm]);

  const endOffset = itemOffset + itemsPerPage;
  const currentItems = filteredCustomers.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handlePageClick = (e) => {
    if (filteredCustomers.length > 0) {
      setItemOffset((e.selected * itemsPerPage) % filteredCustomers.length);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">

      {/* HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <FiUser className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Customer Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage user profiles and monitor account status.</p>
          </div>
        </div>

        {/* Search & Actions Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FiSearch className="text-slate-400 text-sm" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setItemOffset(0); // Reset pagination on search
              }}
              className="w-full h-[42px] pl-9 pr-4 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>

          {/* Add Customer Button */}
          <button
            onClick={() => navigate('/admin/dashboard/customers/addcustomer')}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold whitespace-nowrap transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <FiPlus className="text-lg" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="w-full bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto w-full flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50/75 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Customer Details</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Group</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Orders</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500 text-sm font-medium">
                    <span className="inline-block w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mr-2 align-middle"></span>
                    Loading customer data...
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{cust.name}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{cust.email}</span>
                        {cust.phone && <span className="text-[10px] text-slate-400 mt-0.5 font-mono">{cust.phone}</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center text-[10px] uppercase px-2.5 py-1 tracking-wider ${getGroupBadgeStyle(cust.customer_group)}`}>
                        {cust.customer_group || 'Regular'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      {cust.orders_count || 0}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {cust.is_active === 1 || cust.is_active === true ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {/* Edit Action */}
                        <button
                          onClick={() => navigate(`/admin/dashboard/customers/edit/${cust.id}`)}
                          title="Edit Customer"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer"
                        >
                          <FiEdit2 size={16} />
                        </button>

                        {/* Delete Action */}
                        <button
                          onClick={() => handleDelete(cust.id, cust.name)}
                          title="Delete Customer"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                        >
                          <FiTrash2 size={16} />
                        </button>

                        {/* View Profile Action */}
                        <button
                          onClick={() => navigate(`/admin/dashboard/customers/${cust.id}`)}
                          title="View Profile"
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all cursor-pointer ml-1"
                        >
                          <FiChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                    <p className="text-sm font-bold text-slate-700">No Customers Found</p>
                    <p className="text-xs mt-1">There are no customer records matching your search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION SECTION */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-500">
              Showing {itemOffset + 1} to {Math.min(endOffset, filteredCustomers.length)} of {filteredCustomers.length} results
            </div>
            <ReactPaginate
              onPageChange={handlePageClick}
              pageCount={pageCount}
              containerClassName={"flex items-center space-x-1"}
              pageClassName={"w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-medium cursor-pointer hover:bg-slate-100 text-slate-600 transition-colors"}
              activeClassName={"!bg-slate-900 !text-white !border-slate-900"}
              previousLabel={<ArrowBackIosIcon style={{ fontSize: 10 }} />}
              nextLabel={<ArrowForwardIosIcon style={{ fontSize: 10 }} />}
              previousClassName={"w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"}
              nextClassName={"w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCustomers;