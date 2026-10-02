import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiShield, FiX, FiCheck,
  FiUser, FiSearch, FiChevronRight, FiArrowLeft, FiMail, FiClock, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Swal from "sweetalert2";

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from '../../utils/api';

const StaffUsers = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Page States
  const [viewState, setViewState] = useState('list'); // 'list' | 'view'
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const defaultFormData = {
    name: '',
    email: '',
    password: '',
    role: 'Order Manager',
    status: 'active',
    permissions: []
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Exact Sidebar Menu Structure mapped for Granular Permissions
  const permissionModules = [
    {
      id: 'inventory',
      title: 'Inventory',
      actions: [
        { key: 'inventory_all_products', label: 'All Products' },
        { key: 'inventory_add_product', label: 'Add Product' },
        { key: 'inventory_categories', label: 'Categories' },
        { key: 'inventory_brands', label: 'Brands' },
        { key: 'inventory_stock_audit', label: 'Stock Audit' }
      ]
    },
    {
      id: 'order_management',
      title: 'Order Management',
      actions: [
        { key: 'orders_all_orders', label: 'All Orders' },
        { key: 'orders_returns_rma', label: 'Returns & RMA' }
      ]
    },
    {
      id: 'customers_payments',
      title: 'Customers & Payments',
      actions: [
        { key: 'customers_list', label: 'Customer List' },
        { key: 'customers_reviews', label: 'Reviews' },
        { key: 'customers_transactions', label: 'Transactions' },
        { key: 'customers_refunds', label: 'Refunds' }
      ]
    },
    {
      id: 'logistics_analytics',
      title: 'Logistics & Analytics',
      actions: [
        { key: 'logistics_shipments', label: 'Shipments' },
        { key: 'logistics_sales_analytics', label: 'Sales Analytics' },
        { key: 'logistics_revenue_reports', label: 'Revenue Reports' }
      ]
    },
    {
      id: 'system',
      title: 'System',
      actions: [
        { key: 'system_coupons', label: 'Coupons' },
        { key: 'system_marketing_campaigns', label: 'Marketing Campaigns' },
        { key: 'system_tax_invoices', label: 'Tax Invoices' },
        { key: 'system_staff_users', label: 'Staff Users' },
        { key: 'system_store_settings', label: 'Store Settings' }
      ]
    }
  ];

  // Extract all valid action keys for validation and accurate counting
  const validActionKeys = permissionModules.flatMap(m => m.actions.map(a => a.key));

  // Securely Fetch Staff List from Backend API
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      const response = await api.get('/api/v1/admin/staff');
      const responseData = response.data?.data || response.data;

      const list = Array.isArray(responseData) ? responseData : [];

      // Sort list so that Super Admin / Owner always appears at the top
      const sortedList = list.sort((a, b) => {
        const roleA = (a.role || '').toLowerCase();
        const roleB = (b.role || '').toLowerCase();
        if (roleA.includes('super')) return -1;
        if (roleB.includes('super')) return 1;
        return 0;
      });

      setStaffList(sortedList);
    } catch (error) {
      console.error("Failed to load staff", error);
      Swal.fire("Error", "Failed to fetch staff data from server.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Handle individual permission checkbox toggle
  const handleCheckboxChange = (key) => {
    let updatedPermissions = [...formData.permissions];
    if (updatedPermissions.includes(key)) {
      updatedPermissions = updatedPermissions.filter(p => p !== key);
    } else {
      updatedPermissions.push(key);
    }
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  // Handle "Select All" / "Deselect All" for a specific permission module
  const handleModuleSelectAll = (moduleActions) => {
    const actionKeys = moduleActions.map(a => a.key);
    const allSelected = actionKeys.every(key => formData.permissions.includes(key));

    let newPermissions = [...formData.permissions];

    if (allSelected) {
      newPermissions = newPermissions.filter(key => !actionKeys.includes(key));
    } else {
      actionKeys.forEach(key => {
        if (!newPermissions.includes(key)) {
          newPermissions.push(key);
        }
      });
    }
    setFormData({ ...formData, permissions: newPermissions });
  };

  // Secure Form Submission for Creating or Updating Staff
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      if (editMode) {
        await api.put(`/api/v1/admin/staff/${currentId}`, formData);
        toast.success("Staff updated successfully!");

        if (viewState === 'view') {
          setSelectedStaff({ ...selectedStaff, ...formData });
        }
      } else {
        await api.post('/api/v1/admin/staff', formData);
        toast.success("Staff member created successfully!");
      }

      setIsModalOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "An error occurred during submission.";
      Swal.fire("Failed", errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize form for Editing and map exact sidebar keys safely
  const handleEdit = (staff) => {
    setEditMode(true);
    setCurrentId(staff.id);

    let assignedPermissions = [];

    if (staff.permissions && Array.isArray(staff.permissions) && staff.permissions.length > 0) {
      assignedPermissions = staff.permissions
        .map(p => (typeof p === 'string' ? p : p.name))
        .filter(key => validActionKeys.includes(key));
    }

    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: '', // Kept empty for security
      role: staff.role || 'Order Manager',
      status: staff.status || 'active',
      permissions: [...new Set(assignedPermissions)]
    });
    setIsModalOpen(true);
  };

  // Secure Deletion handling with Super Admin Protection
  const handleDelete = async (staff) => {
    const roleLower = (staff.role || '').toLowerCase();
    const emailLower = (staff.email || '').toLowerCase();

    // RESTRICTION: Block Super Admin deletion entirely for security
    if (roleLower.includes('super') || emailLower === 'admin@myshop.com') {
      Swal.fire({
        title: 'Action Restricted!',
        text: 'The Super Admin (Owner) account cannot be deleted for system security reasons.',
        icon: 'error',
        confirmButtonColor: '#0f172a',
        customClass: {
          popup: 'rounded-2xl shadow-xl border border-slate-200',
          confirmButton: 'rounded-lg px-5 py-2.5 font-bold tracking-wide'
        }
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this staff removal!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, remove them!',
      customClass: {
        popup: 'rounded-2xl shadow-xl border border-slate-200',
        confirmButton: 'rounded-lg px-5 py-2.5 font-bold tracking-wide',
        cancelButton: 'rounded-lg px-5 py-2.5 font-bold tracking-wide'
      }
    });

    if (result.isConfirmed) {
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        await api.delete(`/api/v1/admin/staff/${staff.id}`);
        toast.success("Staff removed successfully!");

        if (viewState === 'view' && selectedStaff?.id === staff.id) {
          handleBackToList();
        }

        fetchStaff();
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "Failed to delete staff member.", "error");
      }
    }
  };

  // Reset form to pristine state
  const resetForm = () => {
    setEditMode(false);
    setCurrentId(null);
    setFormData(defaultFormData);
  };

  const handleView = (staff) => {
    setSelectedStaff(staff);
    setViewState('view');
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedStaff(null);
  };

  // Determine role badge styling with special highlight for Super Admin / Owner
  const getRoleBadgeStyle = (role, email) => {
    const roleLower = role?.toLowerCase() || '';
    const emailLower = email?.toLowerCase() || '';

    if (roleLower.includes('super') || emailLower === 'admin@myshop.com') {
      return 'border border-rose-200 bg-rose-50 text-rose-700 font-black shadow-xs';
    }
    if (roleLower.includes('admin')) return 'border border-blue-200 bg-blue-50 text-blue-700';
    if (roleLower.includes('manager')) return 'border border-amber-200 bg-amber-50 text-amber-700';
    return 'border border-slate-200 bg-slate-50 text-slate-600';
  };

  // Apply search filter safely
  const filteredStaff = staffList.filter(staff =>
    (staff.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (staff.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">

      {/* ========================================================================= */}
      {/* LIST VIEW (TABLE) */}
      {/* ========================================================================= */}
      {viewState === 'list' && (
        <div className="animate-fade-in">
          {/* HEADER SECTION */}
          <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs shrink-0">
                <FiUsers className="text-xl" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Staff Users Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">Control sub-admins, employee roles, and system granular permissions.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72 lg:w-80">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              >
                <FiUserPlus size={16} /> Add New Staff
              </button>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden relative min-h-[300px] flex flex-col">

            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                <span className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
              </div>
            )}

            <div className="overflow-x-auto overflow-y-hidden w-full flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Staff Name & Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Permissions Granted</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => {
                      const isSuperAdmin = (staff.role || '').toLowerCase().includes('super') || (staff.email || '').toLowerCase() === 'admin@myshop.com';

                      const validPermsCount = staff.permissions
                        ? staff.permissions.map(p => typeof p === 'string' ? p : p.name).filter(k => validActionKeys.includes(k)).length
                        : 0;

                      return (
                        <tr key={staff.id} className={`hover:bg-slate-50 transition-colors group ${isSuperAdmin ? 'bg-slate-50/60' : ''}`}>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-bold text-slate-900 text-[13px] flex items-center gap-2">
                                {staff.name || 'Unnamed'}
                                {isSuperAdmin && (
                                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Owner</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{staff.email || 'N/A'}</div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(staff.role, staff.email)}`}>
                              {isSuperAdmin ? 'SUPER ADMIN (OWNER)' : (staff.role || 'Unknown').replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {isSuperAdmin ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                                Full System Access
                              </span>
                            ) : validPermsCount > 0 ? (
                              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">
                                {validPermsCount} Actions Granted
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No permissions</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${staff.status?.toLowerCase() === 'active'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                              }`}>
                              {staff.status || 'Unknown'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-slate-400">
                              <button
                                type="button"
                                onClick={() => handleEdit(staff)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                                title="Edit Staff"
                              >
                                <FiEdit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(staff)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${isSuperAdmin
                                  ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-400'
                                  : 'hover:bg-rose-50 hover:text-rose-600'
                                  }`}
                                title={isSuperAdmin ? "Super Admin cannot be deleted" : "Delete Staff"}
                              >
                                <FiTrash2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleView(staff)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                                title="View Staff Profile"
                              >
                                <FiChevronRight size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-3">
                            <FiUsers size={24} />
                          </div>
                          <p className="text-slate-500 text-sm font-medium">
                            {loading ? 'Fetching staff data...' : 'No staff members found matching your search.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW STATE (PROFILE & PERMISSIONS) */}
      {/* ========================================================================= */}
      {viewState === 'view' && selectedStaff && (
        <div className="animate-fade-in">

          <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs shrink-0">
                <FiUser className="text-xl" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Staff Profile</h1>
                <p className="text-xs text-slate-500 mt-0.5">View staff details and assigned system access.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <FiArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedStaff)}
                className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <FiTrash2 size={14} /> Delete
              </button>
              <button
                type="button"
                onClick={() => handleEdit(selectedStaff)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <FiEdit2 size={14} /> Edit Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-1 space-y-6">

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-slate-900"></div>

                <div className="relative mt-8 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white p-1.5 rounded-2xl shadow-sm mb-3">
                    <div className="w-full h-full bg-slate-50 border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-bold text-2xl uppercase">
                      {(selectedStaff.name || 'U').charAt(0)}
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 text-center">{selectedStaff.name || 'Unnamed'}</h2>
                  <p className="text-sm text-slate-500 mb-4">{selectedStaff.email || 'N/A'}</p>

                  <div className="flex flex-wrap justify-center items-center gap-2">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(selectedStaff.role, selectedStaff.email)}`}>
                      {(selectedStaff.role || 'Unknown').replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${selectedStaff.status === 'active'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}>
                      {selectedStaff.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">Account Information</h3>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                      <FiMail size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</div>
                      <div className="text-sm font-medium text-slate-800 mt-0.5 truncate" title={selectedStaff.email}>{selectedStaff.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                      <FiShield size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">System Role</div>
                      <div className="text-sm font-medium text-slate-800 mt-0.5 capitalize">{(selectedStaff.role || '').replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                      <FiClock size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Member Since</div>
                      <div className="text-sm font-medium text-slate-800 mt-0.5">
                        {selectedStaff.created_at ? new Date(selectedStaff.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs h-full flex flex-col overflow-hidden">

                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Module Access & Permissions</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Overview of actions this staff member can perform.</p>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold shrink-0 shadow-sm w-fit">
                    {selectedStaff.permissions ? selectedStaff.permissions.map(p => typeof p === 'string' ? p : p.name).filter(k => validActionKeys.includes(k)).length : 0} Actions Granted
                  </div>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                  {permissionModules.map((module) => {
                    const hasModuleAccess = module.actions.some(a => selectedStaff.permissions?.map(p => typeof p === 'string' ? p : p.name).includes(a.key));

                    return (
                      <div key={module.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:border-slate-300">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                          <span className="text-sm font-bold text-slate-800 tracking-tight">{module.title}</span>
                          {hasModuleAccess ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                              Access Granted
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                              No Access
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {module.actions.map(action => {
                            const isGranted = selectedStaff.permissions?.map(p => typeof p === 'string' ? p : p.name).includes(action.key);
                            return isGranted ? (
                              <div key={action.key} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md text-xs font-bold shadow-sm">
                                <FiCheckCircle size={14} className="text-indigo-600" />
                                <span>{action.label}</span>
                              </div>
                            ) : null;
                          })}

                          {!hasModuleAccess && (
                            <div className="text-xs text-slate-400 font-medium italic flex items-center gap-1.5">
                              <FiX size={14} className="text-slate-300" /> User cannot access or modify {module.title.toLowerCase()}.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col border border-slate-200 my-auto animate-fade-in max-h-full"
          >
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/5 flex items-center justify-center">
                  <FiShield className="text-xl text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide uppercase">
                    {editMode ? 'Edit Staff Profile' : 'Create New Staff'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Configure role credentials and module access control.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8 overflow-y-auto">

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <FiUser size={16} /> Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all"
                      placeholder="rahul@myshop.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                    Password {!editMode && <span className="text-rose-500">*</span>} {editMode && <span className="text-slate-400 font-normal normal-case">(optional)</span>}
                  </label>
                  <input
                    type="password"
                    {...(!editMode && { required: true })}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">Role Designation</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => {
                      const selectedRole = e.target.value;
                      let defaultPerms = [];
                      const roleLower = selectedRole.toLowerCase();

                      // Set default permissions when the role changes
                      if (roleLower.includes('order')) {
                        defaultPerms = ['orders_all_orders', 'orders_returns_rma'];
                      } else if (roleLower.includes('store') || roleLower.includes('inventory')) {
                        defaultPerms = ['inventory_all_products', 'inventory_add_product', 'inventory_categories', 'inventory_brands'];
                      } else if (roleLower.includes('billing')) {
                        defaultPerms = ['customers_transactions', 'customers_refunds', 'system_tax_invoices'];
                      } else if (roleLower.includes('support')) {
                        defaultPerms = ['customers_list', 'customers_reviews', 'orders_all_orders'];
                      } else if (roleLower.includes('admin')) {
                        // If the role is Admin, you can grant all permissions or keep them at defaul
                        defaultPerms = [];
                      }

                      setFormData({
                        ...formData,
                        role: selectedRole,
                        permissions: defaultPerms
                      });
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Role</option>
                    <option value="Super Admin" disabled className="text-slate-300 bg-slate-100">Super Admin (System Owner)</option>
                    <option value="Admin">Admin</option>
                    <option value="Order Manager">Order Manager</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Billing Manager">Billing Manager</option>
                    <option value="Legal Revenue">Legal / Revenue Department</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FiShield size={16} /> Granular Permissions
                  </h4>
                  <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-200 shadow-sm w-fit">
                    {formData.permissions.length} Actions Granted
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissionModules.map((module) => {
                    const allSelected = module.actions.every(a => formData.permissions.includes(a.key));

                    return (
                      <div key={module.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-sm">

                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/80">
                          <span className="text-sm font-bold text-slate-800">{module.title}</span>
                          <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 cursor-pointer select-none bg-indigo-50/50 px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={() => handleModuleSelectAll(module.actions)}
                              className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                            />
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {module.actions.map(action => {
                            const isChecked = formData.permissions.includes(action.key);
                            return (
                              <label
                                key={action.key}
                                className={`flex items-center gap-2.5 text-xs font-bold cursor-pointer p-2.5 border rounded-lg shadow-sm transition-all select-none ${isChecked
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleCheckboxChange(action.key)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                                />
                                {action.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 bg-slate-50 border-t border-slate-200 rounded-b-2xl shrink-0">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold cursor-pointer shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <FiCheck size={16} />
                )}
                {isSubmitting ? 'Saving...' : editMode ? 'Update Staff Member' : 'Save & Grant Access'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default StaffUsers;